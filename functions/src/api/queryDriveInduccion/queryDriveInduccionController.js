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
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const api = google.sheets({ version: "v4", auth });
  const response = await api.spreadsheets.values.get({
    spreadsheetId: "1w0UkLnROOQDd2GD6kOmQMNjrhmCQHwEplKCC-62sI8A",
    range: "Hoja 1!A:J",
  });

  let matches = [];

  for (let row of response.data.values) {
    if ((row[0] + "").trim() === dni.trim()) {
      let isApproved = false;
      let isValidDate = false;
      const validityDate = row[4];
      const splittedDate = validityDate.split("/");
      const validity = new Date(
        parseInt(splittedDate[2]),
        parseInt(splittedDate[1]) - 1,
        parseInt(splittedDate[0])
      ).getTime();

      const now = Date.now() - 5 * 60 * 60 * 1000;
      // const validity = new Date(row[4].split('/')).getTime();
      const status = row[9];

      functions.logger.info(row[4], { structuredData: true });
      functions.logger.info(validity, { structuredData: true });
      functions.logger.info(status, { structuredData: true });

      // check if the status is approved
      isApproved = status === "APROBADO";
      // check if date is still valid
      isValidDate = now < validity;

      matches.unshift({ isApproved, isValidDate, validity });
    }
  }

  if (matches.length > 0) {
    functions.logger.info(matches, { structuredData: true });
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

    functions.logger.info(match, { structuredData: true });

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
}

async function getSymptomatology(dni) {
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const api = google.sheets({ version: "v4", auth });
  // 1DCRDAJfvpOaDOYzAN4qK2UKY5lC-ug1faKUO1m-ba4g
  const response = await api.spreadsheets.values.get({
    spreadsheetId: "10fKlzt9m7O1uiDW8tfI3nx4qj6xGl2qSDVEdNQtxWgY",
    range: "Hoja 1!G:P",
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
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const api = google.sheets({ version: "v4", auth });
  const response = await api.spreadsheets.values.get({
    spreadsheetId: "1ZsvZz3-Rhc_SEQDBrOkcvNBuE3msUF9CX72zrSeRPrA",
    range: "Hoja 1!A:J",
  });

  let matches = [];

  for (let row of response.data.values) {
    if (row[0] + "" === dni) {
      let isApproved = false;
      let isValidDate = false;
      const validityDate = row[8];
      functions.logger.info(row[8], { structuredData: true });
      const splittedDate = validityDate.split("/");
      const validity = new Date(
        parseInt(splittedDate[2]),
        parseInt(splittedDate[1]) - 1,
        parseInt(splittedDate[0])
      ).getTime();

      const now = Date.now() - 5 * 60 * 60 * 1000;
      // const validity = new Date(row[4].split('/')).getTime();
      const status = row[9];

      // functions.logger.info(row[4], { structuredData: true });
      // functions.logger.info(validity, { structuredData: true });
      // functions.logger.info(status, { structuredData: true });

      // check if the status is approved
      isApproved = status === "VIGENTE";
      // check if date is still valid
      isValidDate = now < validity;

      matches.unshift({ isApproved, isValidDate, validity });
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
}

module.exports = queryDriveInduccionController;
