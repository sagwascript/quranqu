import { useState, useEffect } from "react";
import basmalah from "../assets/basmalah.svg";
import clsx from "clsx";
import { range, shuffle } from "lodash";
import { Modal } from "antd";

function Main() {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState(0);
  const [chapter, setChapter] = useState(114); // Start from An-Nas
  const [data, setData] = useState(null);
  const [verses, setVerses] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const storeAnswer = (answerSlotIdx, answer, selectedAnswer) => {
    if (!answer && !selectedAnswer) return;
    if (answer && !selectedAnswer) return removeAnswer(answerSlotIdx, answer);
    setAnswers((prev) =>
      prev.map((answer, idx) =>
        idx === answerSlotIdx ? selectedAnswer : answer
      )
    );
    setVerses((prev) => prev.filter((verse) => verse.id !== selectedAnswer.id));
    setSelectedVerse(null);
    // Change score on correctly answered
    if (answerSlotIdx + 1 === selectedAnswer.id) {
      setScores((prev) => prev + 10);
    }
  };
  const removeAnswer = (answerSlotIdx, selectedAnswer) => {
    // Correctly answered
    if (answerSlotIdx + 1 === selectedAnswer.id) {
      return;
    }
    setAnswers((prev) =>
      prev.map((answer) =>
        answer === null || answer.id !== selectedAnswer.id ? answer : null
      )
    );
    setVerses((prev) => [...prev, selectedAnswer]);
  };
  const toggleSelectVerse = (selected) => {
    // Currently selected
    if (selectedVerse?.id === selected.id) setSelectedVerse(null);
    else setSelectedVerse(selected);
  };
  const reshuffle = () => {
    if (verses.length === 0) return;
    const shuffledOrders = shuffle(range(0, data["total_verses"]));
    setVerses(shuffledOrders.map((order) => verses[order]));
  };

  useEffect(() => {
    setLoading(true);
    fetch(
      `https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters/id/${chapter}.json`
    )
      .then((response) => response.json())
      .then((data) => {
        const { verses, ...info } = data;
        const totalVerses = info["total_verses"];
        const shuffledOrders = shuffle(range(0, totalVerses));
        setData(info);
        setVerses(shuffledOrders.map((order) => verses[order]));
        setAnswers(Array(totalVerses).fill(null));
        setLoading(false);
      });
  }, [chapter]);

  useEffect(() => {
    // Check if all correct
    if (verses.length === 0 && data) {
      const correct = answers.reduce((acc, answer, idx) => {
        if (answer.id === idx + 1) return (acc += 1);
        return acc;
      }, 0);
      if (correct === data["total_verses"])
        Modal.success({
          title: "Congratulations! You have completed this chapter.",
          okText: "Go to the next chapter!",
          onOk: () => {
            setChapter((prev) => prev - 1);
          },
        });
    }
  }, [verses, answers, data]);

  return (
    <div className="w-screen h-screen">
      <div className="flex justify-between gap-x-4 w-full h-full p-6">
        <div className="flex flex-col gap-y-6 w-3/5 h-full">
          {/* Heading */}
          <div className="flex flex-col w-full gap-y-2">
            {/* Surah Name */}
            <div className="w-full flex flex-col items-center justify-center bg-gray-100 rounded h-16">
              <h1 className="font-medium text-2xl">
                {!loading ? data.transliteration : "Loading..."}
              </h1>
              <span className="text-sm font-medium">
                {!loading ? data.translation : "Loading..."}
              </span>
            </div>
            {/* Basmalah */}
            <div className="w-full flex items-center justify-center text-3xl h-12 bg-gray-100 rounded font-arabic">
              <img src={basmalah} className="h-10" />
            </div>
          </div>
          {/* Content: Ayah Drop Container */}
          <div className="w-full h-full flex flex-col gap-y-3 overflow-y-auto rounded p-4 bg-gray-100">
            {loading && "Loading..."}
            {!loading &&
              answers.length > 0 &&
              answers.map((answer, idx) => {
                return (
                  <div
                    key={`answer-slot-${idx}`}
                    onClick={() => storeAnswer(idx, answer, selectedVerse)}
                    className={clsx(
                      "flex items-center gap-x-4 px-3 py-3 rounded bg-gray-200 hover:bg-gray-300 transition-colors duration-100 ease-linear cursor-pointer",
                      answer !== null &&
                        answer.id !== idx + 1 &&
                        "border-dashed border-2 border-red-400"
                    )}
                  >
                    {/* Numbering */}
                    <div className="rounded-lg font-arabic text-4xl text-center -mt-1">
                      {new Intl.NumberFormat("ar-EG").format(idx + 1)}
                    </div>
                    {/* Verse Drop */}
                    {/* On empty answer */}
                    {answer === null && (
                      <div className="flex flex-col min-h-[68px] gap-y-1 w-full"></div>
                    )}
                    {/* On filled answer */}
                    {answer !== null && (
                      <div className="flex flex-col gap-y-1 w-full">
                        <p className="text-right w-full font-arabic text-3xl mt-1">
                          {answer.text}
                        </p>
                        <p className="text-left w-full font-light">
                          {answer.translation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
        <div className="flex flex-col gap-y-6 w-2/5 h-full">
          {/* Info Container */}
          <div className="flex justify-between items-center w-full h-[120px] p-4 rounded bg-gray-100">
            {/* User Info */}
            <div className="flex flex-col justify-center gap-y-2 w-2/3 h-full">
              {/* User Name */}
              <div className="flex items-center gap-x-2">
                {/* Icon */}
                <div className="h-[20px] w-[20px] rounded bg-gray-300"></div>
                {/* Info Text */}
                <span className="block font-semibold">User: sagwascript</span>
              </div>
              {/* User Score */}
              <div className="flex items-center gap-x-2">
                {/* Icon */}
                <div className="h-[20px] w-[20px] rounded bg-gray-300"></div>
                {/* Info Text */}
                <span className="block font-semibold">Score: {scores} pts</span>
              </div>
              {/* Difficulty */}
              <div className="flex items-center gap-x-2">
                {/* Icon */}
                <div className="h-[20px] w-[20px] rounded bg-gray-300"></div>
                {/* Info Text */}
                <span className="block font-semibold">Difficulty: Easy</span>
              </div>
            </div>
            {/* Badge */}
            <div className="w-[90px] h-[90px] rounded-md bg-gray-300"></div>
          </div>
          {/* Content: Un-ordered Ayah Drop Container */}
          <div className="relative w-full h-full flex flex-col gap-y-3 overflow-y-auto rounded p-4 bg-gray-100">
            <button onClick={reshuffle} className="absolute bottom-0 right-0">
              Reshuffle
            </button>
            {loading && "Loading..."}
            {!loading && verses.length === 0 && "No verses left"}
            {!loading &&
              verses.length > 0 &&
              verses.map((verse, idx) => {
                return (
                  <div
                    key={`shuffled-${idx}`}
                    onClick={() => toggleSelectVerse(verse)}
                    className={clsx(
                      "flex items-center gap-x-4 px-3 py-3 rounded bg-gray-200 hover:bg-gray-300 transition-colors duration-100 ease-linear cursor-pointer",
                      selectedVerse?.id === verse.id &&
                        "border-2 border-gray-700"
                    )}
                  >
                    {/* Ayah Drop */}
                    <div className="flex flex-col gap-y-1 w-full">
                      <p className="text-right w-full font-arabic text-3xl mt-1">
                        {verse.text}
                      </p>
                      <p className="text-left w-full font-light">
                        {verse.translation}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Main;
