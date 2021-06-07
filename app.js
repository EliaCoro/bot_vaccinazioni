const puppeteer = require('puppeteer');

let namePlaces = [
    "La cittadella",
    "Chioggia",
    "Dolo ospedale",
    "Dolo palazzetto dello sport",
    "Lido di venezia",
    "Mira",
    "Mirano bocciodromo",
    "Mirano bocciodromo aggiuntivo",
    "Venezia - ospedale SS Giovanni",
    "Venezia - Pala Expo",
    "Venezia - Rampa santa chiara"
];

const user = {
    name: "",
    surname: "",
    email: "@gmail.com",
    fiscalCode: "",
    idFiscalCode: "",
    phone: "",
    places: [
        true, //La cittadella
        true, //Chioggia
        true, //Dolo ospedale
        true, //Dolo palazzetto dello sport
        true, //Lido di venezia
        true, //Mira
        true, //Mirano bocciodromo
        true, //MIrano bocciodromo aggiuntivo
        true, //Venezia - ospedale SS Giovanni
        true, //Venezia - Pala Expo
        true //Venezia - Rampa santa chiara
    ],
    maxDate: new Date("2020/06/30")
};

const ulssLink = "https://vaccinicovid.regione.veneto.it/ulss3";

(async () => {
    let reservation = true;
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    let page;
    let isAvailable;
    while (reservation) {
        try {
            page = await browser.newPage();
            await page.setDefaultNavigationTimeout(0);
            await page.goto(ulssLink);

            // PRIMA PAGINA
            await page.type('#cod_fiscale', user.fiscalCode);
            await page.type('#num_tessera', user.idFiscalCode);
            //await page.click('input[type="checkbox"]:nth-child(1)');
            let button = await page.$$('input[type="checkbox"]');
            await button[1].click();
            await page.click('.btn-primary');
            console.log("[1] - Dati inseriti correttamente")
            await page.waitForTimeout(800);
            await page.click('button[onclick="scegliserv(178)"]');
            await page.waitForTimeout(800);
            for (let i = 0; i < 11; i++) {
                if (user.places[i]) {
                    isAvailable = (await page.$('button.btn.btn-primary.btn-full:nth-child(' + (i + 3) + ')[disabled]')) == null;
                    if (isAvailable) {
                        await page.click('.btn-full:nth-child(' + (i + 3) + ')');
                        console.log("[2] - Trovata una prenotazione libera a " + namePlaces[i]);
                        await page.waitForTimeout(500)
                        try {
                            // Prende tutte le date disponibili
                            let dates = await page.$$('td.highlight');

                            // Se non ci sono date l'esecuzione del programma viene arrestata
                            if (dates == [] || dates.length == 0) {
                                await page.click('button[aria-label="next"]');
                                dates = await page.$$('td.highlight');
                                if (dates == [] || dates.length == 0)
                                    throw ("Non ci sono date");
                            }

                            // Viene selezionata la prima data disponibile
                            let hrefElement = await page.$('td.highlight:nth-child(1)');
                            let attr = await page.$$eval("td.highlight:nth-child(1)", el => el.map(x => x.getAttribute("data-date")));

                            if (hrefElement == null || hrefElement == undefined) {
                                hrefElement = await page.$("td.highlight");
                                attr = await page.evaluate(el => el.getAttribute("data-date"), hrefElement);
                            }
                            if ((new Date(attr[0])).getTime() <= user.maxDate.getTime()) {
                                await hrefElement.click();
                                await page.waitForTimeout(500)
                                console.log("[3] - Giorno selezionato");
                                await page.click('.btn-full');
                                await page.waitForTimeout(500)
                                await page.type('input[name="cognome"]', user.surname);
                                await page.type('input[name="nome"]', user.name);
                                await page.type('input[name="email"]', user.email);
                                await page.type('input[name="cellulare"]', user.phone);
                                await page.screenshot({
                                    fullPage: true,
                                    path: 'resume/' + user.name + user.surname + '_resume.png'
                                })
                                await page.click('#bottoneconferma');
                                await page.waitForTimeout(500)
                                    await page.screenshot({
                                        fullPage: true,
                                        path: 'resume/' + user.name + user.surname + '_resume.png'
                                    })
                                reservation = false;
                            }
                        } catch (error) {
                            console.log("Non ci sono date disponibili per questo mese.")
                        }
                    }
                }
            }
        } catch (error) {
            await page.screenshot({
                fullPage: true,
                path: 'error/' + 'error.png'
            })
            //throw (error);
        }
        //await page.waitForTimeout(800)
        await page.close();
        console.log("=========================================================");
    }
    await browser.close();
})();