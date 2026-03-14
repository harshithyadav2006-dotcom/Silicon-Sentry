const keywordMap = [
  { category: "Roads", words: ["pothole", "road", "traffic signal", "street", "junction"] },
  { category: "Water Supply", words: ["water", "pipeline", "drain", "sewage", "leakage"] },
  { category: "Sanitation", words: ["garbage", "waste", "cleanliness", "trash", "dump"] },
  { category: "Street Lights", words: ["street light", "dark", "lamp", "lighting"] },
  { category: "Public Safety", words: ["unsafe", "harassment", "threat", "crime", "accident"] },
];

const highPriorityWords = ["urgent", "immediately", "serious", "unsafe", "emergency"];
const negativeWords = ["bad", "poor", "angry", "frustrated", "upset", "terrible"];

const analyzeComplaint = (description, department, selectedCategory) => {
  const text = `${description} ${department} ${selectedCategory || ""}`.toLowerCase();

  const matchedCategory =
    selectedCategory ||
    keywordMap.find((item) => item.words.some((word) => text.includes(word)))?.category ||
    "Civic Issue";

  const priority = highPriorityWords.some((word) => text.includes(word))
    ? "High"
    : text.length > 120
      ? "Medium"
      : "Low";

  const sentiment = negativeWords.some((word) => text.includes(word))
    ? "Negative"
    : "Neutral";

  return {
    category: matchedCategory,
    priority,
    sentiment,
  };
};

module.exports = {
  analyzeComplaint,
};
