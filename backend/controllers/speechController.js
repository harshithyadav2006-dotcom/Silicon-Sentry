const { transcribeSpeech, translateText } = require("../config/googleCloud");

const transcribeAndTranslate = async (req, res) => {
  const { audioBase64, mimeType, sourceLanguage = "en-IN", targetLanguage = "en" } = req.body;

  if (!audioBase64 || !mimeType) {
    return res.status(400).json({
      message: "audioBase64 and mimeType are required.",
    });
  }

  try {
    const transcript = await transcribeSpeech({
      audioBase64,
      mimeType,
      languageCode: sourceLanguage,
    });

    const translatedText = await translateText({
      text: transcript,
      sourceLanguageCode: sourceLanguage.split("-")[0],
      targetLanguageCode: targetLanguage,
    });

    return res.json({
      transcript,
      translatedText,
      sourceLanguage,
      targetLanguage,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  transcribeAndTranslate,
};
