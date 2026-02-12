const { auth, db } = require("../../../server");
const functions = require("firebase-functions");
const { google } = require("googleapis");

const queryDriveInduccionController = async (req, res) => {
  try {
    console.log("Here!");
    const dni = req.params.dni + "";
    console.log(dni);

    const induction = await getInduction(dni);
    // const symptomatology = await getSymptomatology(dni);
    const loto = await getLoto(dni);

    let retVal = {};

    retVal = {
      status: "success",
      data: {
        inductionStatus: induction ? induction.status : "unassigned",
        inductionValidity: induction ? induction.validity : 0,
        // symptomatologyStatus: symptomatology
        //   ? symptomatology.status
        //   : "unassigned",
        symptomatologyStatus: "unassigned",
        // symptomatologyValidity: symptomatology ? symptomatology.validity : 0,
        symptomatologyValidity: 0,
        lotoStatus: loto ? loto.status : "unassigned",
        lotoValidity: loto ? loto.validity : 0,
      },
    };

    functions.logger.info(retVal, {
      structuredData: true,
    });

    functions.logger.info(`Collaborator queried`, {
      structuredData: true,
    });

    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(retVal));
  } catch (error) {
    functions.logger.error(`Could not query collaborator`, error);
    res.status(500).json({
      ok: false,
      msg: "Bad request",
      error,
    });
  }
};

async function getInduction(dni) {
  try {
    const auth = await google.auth.getClient({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const api = google.sheets({ version: "v4", auth });
    const response = await api.spreadsheets.values.get({
      spreadsheetId: "1CaRMmuKIRQpANB4XXM3p5YpD-OyrOHoXBPxonret9P8",
      range: "INDUCCIÓN!B:N",
    });

    if (!response.data || !response.data.values) {
      throw new Error("No data found in the spreadsheet");
    }

    let matches = [];

    for (let row of response.data.values) {
      if ((row[0] + "").trim() === (dni + "").trim()) {
        let isApproved = false;
        let isValidDate = false;
        const validityDate = row[9];

        if (!validityDate) {
          throw new Error("Validity date is missing");
        }

        // Separa el día, mes y año de la cadena
        var partesFecha = validityDate.split("-");

        // Obtiene el día, el mes y el año
        var dia = parseInt(partesFecha[0], 10);
        var mes = partesFecha[1]; // El mes ya está en formato de texto
        var año = parseInt(partesFecha[2], 10);

        // Mapea el mes a su número correspondiente (0 para enero, 1 para febrero, etc.)
        var meses = {
          ene: 0,
          feb: 1,
          mar: 2,
          abr: 3,
          may: 4,
          jun: 5,
          jul: 6,
          ago: 7,
          sep: 8,
          oct: 9,
          nov: 10,
          dic: 11,
        };

        // Convierte el mes de texto a número usando el objeto de meses
        var numeroMes = meses[mes.substring(0, 3).toLowerCase()]; // Obtener las primeras tres letras del mes

        // Construye el objeto de fecha utilizando las partes extraídas
        var validity = new Date(año, numeroMes, dia);

        const now = Date.now() - 5 * 60 * 60 * 1000;

        const status = row[12];

        functions.logger.info(row[9], { structuredData: true });
        functions.logger.info(row[12], { structuredData: true });
        functions.logger.info(validity, { structuredData: true });
        functions.logger.info(status, { structuredData: true });

        // check if the status is approved
        isApproved = status === "APTO";
        // check if date is still valid
        isValidDate = now < validity;

        matches.unshift({ isApproved, isValidDate, validity });
      }
    }

    if (matches.length > 0) {
      functions.logger.info(matches, { structuredData: true });
      // prioritize approved+valid matches; fall back to all matches
      const approvedMatches = matches.filter((m) => m.isApproved && m.isValidDate);
      const pool = approvedMatches.length > 0 ? approvedMatches : matches;
      // use timestamps for numeric comparison
      const validityArray = pool.map((match) => match.validity.getTime());
      // get the max value
      const maxValidity = Math.max(...validityArray);
      // get the index of the max value
      const index = validityArray.indexOf(maxValidity);
      // get the match with the max value
      const match = pool[index];

      functions.logger.info(match, { structuredData: true });

      const isApproved = match.isApproved ? match.isApproved : false;
      const isValidDate = match.isValidDate ? match.isValidDate : false;
      const validityDate = match.validity ? match.validity : null;

      if (isApproved && !isValidDate)
        return { status: "expired", validity: validityDate };
      if (!isApproved && isValidDate)
        return { status: "rejected", validity: validityDate };
      if (isApproved && isValidDate)
        return { status: "approved", validity: validityDate };
    } else {
      throw new Error("No matching record found");
    }
  } catch (error) {
    functions.logger.error(`Could not get induction`, error);
    return null;
  }
}

async function getSymptomatology(dni) {
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const api = google.sheets({ version: "v4", auth });
  // 1DCRDAJfvpOaDOYzAN4qK2UKY5lC-ug1faKUO1m-ba4g
  const response = await api.spreadsheets.values.get({
    spreadsheetId: "10fKlzt9m7O1uiDW8tfI3nx4qj6xGl2qSDVEdNQtxWgY",
    range: "'Hoja 1'!G:P",
  });

  let matches = [];

  for (let row of response.data.values) {
    if (row[0] + "" === dni) {
      const quest_1 = row[3];
      const quest_2 = row[4];
      const quest_3 = row[5];
      const quest_4 = row[6];
      const quest_5 = row[7];

      const register = row[9];
      const splittedDate = register.split("/");
      const registerDate = new Date(
        parseInt(splittedDate[2]),
        parseInt(splittedDate[1]) - 1,
        parseInt(splittedDate[0])
      ).getTime();
      const now = Date.now() - 5 * 60 * 60 * 1000;
      const validDate = registerDate + 7 * 24 * 60 * 60 * 1000;

      let tempValidity = false;
      let tempStatus = false;

      functions.logger.info(row[9], { structuredData: true });
      functions.logger.info(now, { structuredData: true });
      functions.logger.info(registerDate, { structuredData: true });
      functions.logger.info(validDate, { structuredData: true });

      // evaluate if all questions are answered with NO
      tempStatus =
        quest_1 === "NO" &&
        quest_2 === "NO" &&
        quest_3 === "NO" &&
        quest_4 === "NO" &&
        quest_5 === "NO";
      // evaluate if the date is still valid, just 7 days valid
      isValid = now < validDate;

      const result = {
        tempStatus: tempStatus,
        isValid: isValid,
        validity: validDate,
      };
      functions.logger.info(result, { structuredData: true });

      matches.unshift(result);
    }
  }

  if (matches.length > 0) {
    // first flat the array ti validity dates
    const validityArray = matches.map((match) => {
      return match.validity;
    });
    // get the max value
    const maxValidity = Math.max(...validityArray);
    // get the index of the max value
    const index = validityArray.indexOf(maxValidity);
    // get the match with the max value
    const match = matches[index];

    const allNots = match.tempStatus;
    const isValid = match.isValid;
    const validity = match.validity;

    if (allNots && !isValid) return { status: "expired", validity: validity };
    if (!allNots && isValid) return { status: "rejected", validity: validity };
    if (allNots && isValid) return { status: "approved", validity: validity };
  }
}

async function getLoto(dni) {
  try {
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const api = google.sheets({ version: "v4", auth });
  const response = await api.spreadsheets.values.get({
    spreadsheetId: "1CaRMmuKIRQpANB4XXM3p5YpD-OyrOHoXBPxonret9P8",
    range: "LOTO!C:O",
  });

  if (!response.data || !response.data.values) {
    throw new Error("No data found in loto spreadsheet");
  }

  let matches = [];

  for (let row of response.data.values) {
    if ((row[0] + "").trim() === (dni + "").trim()) {
      let isApproved = false;
      let isValidDate = false;
      const validityDate = row[9];

      functions.logger.info(`[getLoto] raw row: ${JSON.stringify(row)}`, { structuredData: true });
      functions.logger.info(`[getLoto] validityDate (row[9]): ${validityDate}`, { structuredData: true });
      functions.logger.info(`[getLoto] status (row[12]): ${row[12]}`, { structuredData: true });

      if (!validityDate) {
        functions.logger.warn(`[getLoto] missing validityDate, skipping row`, { structuredData: true });
        continue;
      }

      // Separa el día, mes y año de la cadena
      var partesFecha = validityDate.split("-");

      // Obtiene el día, el mes y el año
      var dia = parseInt(partesFecha[0], 10);
      var mes = partesFecha[1]; // El mes ya está en formato de texto
      // Si el año ya tiene 4 dígitos no se antepone "20"
      var yearRaw = partesFecha[2];
      var año = yearRaw.length === 2 ? "20" + parseInt(yearRaw, 10) : parseInt(yearRaw, 10);
      functions.logger.info(`[getLoto] parsed date parts: dia=${dia}, mes=${mes}, año=${año}`, { structuredData: true });

      // Mapea el mes a su número correspondiente (0 para enero, 1 para febrero, etc.)
      var meses = {
        ene: 0,
        feb: 1,
        mar: 2,
        abr: 3,
        may: 4,
        jun: 5,
        jul: 6,
        ago: 7,
        sep: 8,
        oct: 9,
        nov: 10,
        dic: 11,
      };

      // Convierte el mes de texto a número usando el objeto de meses
      var numeroMes = meses[mes.substring(0, 3).toLowerCase()]; // Obtener las primeras tres letras del mes

      // Construye el objeto de fecha utilizando las partes extraídas
      var validity = new Date(año, numeroMes, dia);

      const now = Date.now() - 5 * 60 * 60 * 1000;

      const status = row[12];

      // functions.logger.info(row[4], { structuredData: true });
      // functions.logger.info(validity, { structuredData: true });
      // functions.logger.info(status, { structuredData: true });

      // check if the status is approved
      isApproved = status === "AUTORIZADO";
      // check if date is still valid
      isValidDate = now < validity;

      matches.unshift({ isApproved, isValidDate, validity });
    }
  }

  if (matches.length > 0) {
    // prioritize approved+valid matches; fall back to all matches
    const approvedMatches = matches.filter((m) => m.isApproved && m.isValidDate);
    const pool = approvedMatches.length > 0 ? approvedMatches : matches;
    // use timestamps for numeric comparison
    const validityArray = pool.map((match) => match.validity.getTime());
    // get the max value
    const maxValidity = Math.max(...validityArray);
    // get the index of the max value
    const index = validityArray.indexOf(maxValidity);
    // get the match with the max value
    const match = pool[index];

    const isApproved = match.isApproved;
    const isValidDate = match.isValidDate;
    const validityDate = match.validity;

    if (isApproved && !isValidDate)
      return { status: "expired", validity: validityDate };
    if (!isApproved && isValidDate)
      return { status: "rejected", validity: validityDate };
    if (isApproved && isValidDate)
      return { status: "approved", validity: validityDate };
  }
  } catch (error) {
    functions.logger.error(`[getLoto] Could not get loto`, error);
    return null;
  }
}

module.exports = queryDriveInduccionController;
