import { useState, useEffect } from "react";
import Basmalah from "../assets/basmalah.svg?react";
import clsx from "clsx";
import { range, shuffle, upperFirst } from "lodash";
import { Modal } from "antd";
import {
  ApartmentOutlined,
  DollarOutlined,
  EditOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DialogUsername from "../components/DialogUsername";
import DialogDifficulty from "../components/DialogDifficulty";
import Badge from "../components/Badge";

function Main() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("sagwascript");
  const [difficulty, setDifficulty] = useState("easy"); // ['easy', 'medium', 'hard']
  const [scores, setScores] = useState(0);
  const [chapter, setChapter] = useState(114); // Start from An-Nas
  const [data, setData] = useState(null);
  const [verses, setVerses] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [dialog, setDialog] = useState({ username: false, difficulty: false });
  const openDialog = (name) => {
    setDialog((prev) => ({ ...prev, [name]: true }));
  };
  const closeDialog = (name) => {
    setDialog((prev) => ({ ...prev, [name]: false }));
  };
  const storeAnswer = (answerSlotIdx, answer, selectedAnswer) => {
    if (!answer && !selectedAnswer) return;
    if (answer && !selectedAnswer) return removeAnswer(answerSlotIdx, answer);
    if (answer && selectedAnswer) {
      setAnswers((prev) =>
        prev.map((answer, idx) =>
          idx !== answerSlotIdx ? answer : selectedAnswer
        )
      );
      setVerses((prev) =>
        prev.map((verse) => (verse.id !== selectedAnswer.id ? verse : answer))
      );
    } else {
      setAnswers((prev) =>
        prev.map((answer, idx) =>
          idx === answerSlotIdx ? selectedAnswer : answer
        )
      );
      setVerses((prev) =>
        prev.filter((verse) => verse.id !== selectedAnswer.id)
      );
      setSelectedVerse(null);
    }
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

  useEffect(() => {
    setLoading(true);
    fetch(
      `https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters/id/${chapter}.json`
    )
      .then((response) => response.json())
      .then((data) => {
        const { verses, ...info } = data;
        const { shuffled, answers } = shuffleVerses(verses, difficulty);
        setData(info);
        setVerses(shuffled);
        setAnswers(answers);
        setLoading(false);
      });
  }, [chapter, difficulty]);

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
    <div className="w-screen h-screen bg-[#343a40]">
      <div className="flex justify-between gap-x-4 w-full h-full p-6">
        <div className="flex flex-col gap-y-6 w-3/5 h-full">
          {/* Heading */}
          <div className="flex flex-col w-full gap-y-2 bg-dark-100 text-white">
            {/* Surah Name */}
            <div className="w-full flex flex-col items-center justify-center rounded h-[120px]">
              <h1 className="font-medium text-4xl font-arabic">
                {!loading ? data.name : "Loading..."}
              </h1>
              <h1 className="font-medium text-xl">
                {!loading ? data.transliteration : "Loading..."}
              </h1>
              <span className="text-sm font-medium">
                {!loading ? data.translation : "Loading..."}
              </span>
            </div>
          </div>
          {/* Content: Ayah Drop Container */}
          <div className="w-full min-h-min flex flex-col gap-y-3 overflow-y-auto rounded p-4 bg-dark-100 text-white">
            {/* Basmalah */}
            <div className="w-full flex place-self-center items-center justify-center pb-3 font-arabic border-b border-gray-300">
              <Basmalah className="fill-current text-white h-10" />
            </div>
            {loading && "Loading..."}
            {!loading &&
              answers.length > 0 &&
              answers.map((answer, idx) => {
                return (
                  <div
                    key={`answer-slot-${idx}`}
                    onClick={() => storeAnswer(idx, answer, selectedVerse)}
                    className={clsx(
                      "flex items-center gap-x-4 px-3 py-3 rounded cursor-pointer",
                      answer === null && "bg-[#262b30]",
                      answer !== null &&
                        answer.id !== idx + 1 &&
                        difficulty !== "hard" &&
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
                        <p className="text-left w-full">{answer.translation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
        <div className="flex flex-col gap-y-6 w-2/5 h-full">
          {/* Info Container */}
          <div className="flex justify-between items-center w-full h-[120px] p-4 rounded bg-dark-100 text-white">
            {/* User Info */}
            <div className="flex flex-col justify-center gap-y-2 w-2/3 h-full">
              {/* User Name */}
              <div
                onClick={() => openDialog("username")}
                className="flex items-center gap-x-2 cursor-pointer group"
              >
                {/* Icon */}
                <div className="flex items-center justify-center h-[20px] w-[20px] rounded-full bg-dark-100">
                  <UserOutlined className="text-white" />
                </div>
                {/* Info Text */}
                <span className="block font-semibold">User: {username}</span>
                {/* Edit Icon */}
                <EditOutlined className="invisible group-hover:visible" />
              </div>
              {/* Difficulty */}
              <div
                onClick={() => openDialog("difficulty")}
                className="flex items-center gap-x-2 cursor-pointer group"
              >
                {/* Icon */}
                <div className="flex items-center justify-center h-[20px] w-[20px] rounded bg-blue-400">
                  <ApartmentOutlined className="text-gray-700" />
                </div>
                {/* Info Text */}
                <span className="block font-semibold">
                  Difficulty: {upperFirst(difficulty)}
                </span>
                {/* Edit Icon */}
                <EditOutlined className="invisible group-hover:visible" />
              </div>
              {/* User Score */}
              <div className="flex items-center gap-x-2">
                {/* Icon */}
                <div className="flex items-center justify-center h-[20px] w-[20px] rounded-full bg-yellow-500">
                  <DollarOutlined className="text-yellow-700" />
                </div>
                {/* Info Text */}
                <span className="block font-semibold">Score: {scores} pts</span>
              </div>
            </div>
            {/* Badge */}
            <Badge scores={scores} />
          </div>
          {/* Content: Un-ordered Ayah Drop Container */}
          <div className="relative w-full min-h-min flex flex-col gap-y-3 overflow-y-auto rounded p-4 bg-dark-100 text-white">
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
                      "flex items-center gap-x-4 px-3 py-3 rounded bg-[#262b30] transition-colors duration-100 ease-linear cursor-pointer",
                      selectedVerse?.id === verse.id && "border-2 border-white"
                    )}
                  >
                    {/* Ayah Drop */}
                    <div className="flex flex-col gap-y-1 w-full">
                      <p className="text-right w-full font-arabic text-3xl mt-1">
                        {verse.text}
                      </p>
                      <p className="text-left w-full">{verse.translation}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      <DialogUsername
        isOpen={dialog.username}
        username={username}
        onClose={() => closeDialog("username")}
        onSubmit={(text) => {
          setUsername(text);
          closeDialog("username");
        }}
      />
      <DialogDifficulty
        isOpen={dialog.difficulty}
        difficulty={difficulty}
        onClose={() => closeDialog("difficulty")}
        onSubmit={(selected) => {
          setDifficulty(selected);
          closeDialog("difficulty");
        }}
      />
    </div>
  );
}

function shuffleVerses(verses, difficulty) {
  const totalVerses = verses.length;
  let shuffled = [],
    answers = [];
  if (difficulty === "easy") {
    // create ranges but remove every even index
    const ranges = range(0, totalVerses).filter((num) => num % 2 !== 0);
    const shuffledOrders = shuffle(ranges);
    shuffled = shuffledOrders.map((order) => verses[order]);
    // automatically fill every even index
    answers = Array(totalVerses)
      .fill(null)
      .map((_, idx) => (idx % 2 === 0 ? verses[idx] : null));
  } else if (difficulty === "medium") {
    // create ranges but remove the first index
    const ranges = range(0, totalVerses).slice(1);
    const shuffledOrders = shuffle(ranges);
    shuffled = shuffledOrders.map((order) => verses[order]);
    // automatically fill the first answer
    answers = Array(totalVerses)
      .fill(null)
      .map((_, idx) => (idx === 0 ? verses[idx] : null));
  } else if (difficulty === "hard") {
    const ranges = range(0, totalVerses);
    let shuffledOrders = shuffle(ranges);
    // shuffled until 8 times to get mixed result
    const maxTries = 8;
    let iter;
    while (iter <= maxTries) {
      const diff = shuffledOrders.reduce((acc, order, idx) => {
        return (acc += order - ranges[idx] === 0 ? 1 : 0);
      }, 0);
      let maxSameIndex = 0;
      if (totalVerses < 5) maxSameIndex = 2;
      else maxSameIndex = Math.round((totalVerses * 1) / 3);
      if (diff < maxSameIndex) break;
      shuffledOrders = shuffle(ranges);
      iter++;
    }
    shuffled = shuffledOrders.map((order) => verses[order]);
    answers = Array(totalVerses).fill(null);
  }
  return {
    shuffled,
    answers,
  };
}

export default Main;
