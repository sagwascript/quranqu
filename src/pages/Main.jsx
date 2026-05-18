import { useState, useEffect, useRef } from "react";
import Basmalah from "../assets/basmalah.svg?react";
import clsx from "clsx";
import { chunk, range, shuffle, upperFirst } from "lodash";
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

const SCORE_INCREASE = Object.freeze({
  easy: 10,
  medium: 20,
  hard: 30,
});

const PAGE_SIZE = 20;

function Main() {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("sagwascript");
  const [difficulty, setDifficulty] = useState("easy"); // ['easy', 'medium', 'hard']
  const [scores, setScores] = useState(0);
  const [chapter, setChapter] = useState(114); // Start from An-Nas
  const [data, setData] = useState(null);
  const [allVerses, setAllVerses] = useState([]); // all verses from API
  const [currentChunk, setCurrentChunk] = useState(0);
  const [verses, setVerses] = useState([]); // shuffled pool for current chunk
  const [answers, setAnswers] = useState([]); // answer slots for current chunk
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [dialog, setDialog] = useState({ username: false, difficulty: false });
  const [slotAnimations, setSlotAnimations] = useState({});
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [isDraggingOverPool, setIsDraggingOverPool] = useState(false);
  const dragSource = useRef(null);

  // Derived: list of chunks and the byte-offset of the current chunk
  const chunks = chunk(allVerses, PAGE_SIZE);
  const chunkOffset = currentChunk * PAGE_SIZE;

  const openDialog = (name) => setDialog((prev) => ({ ...prev, [name]: true }));
  const closeDialog = (name) =>
    setDialog((prev) => ({ ...prev, [name]: false }));

  const triggerAnimation = (slotIdx, type) => {
    if (difficulty === "hard") return;
    setSlotAnimations((prev) => ({ ...prev, [slotIdx]: type }));
    setTimeout(() => {
      setSlotAnimations((prev) => {
        const next = { ...prev };
        delete next[slotIdx];
        return next;
      });
    }, 650);
  };

  const storeAnswer = (answerSlotIdx, answer, selectedAnswer) => {
    if (!answer && !selectedAnswer) return;
    if (answer && !selectedAnswer) return removeAnswer(answerSlotIdx, answer);

    const isCorrect = selectedAnswer.id === chunkOffset + answerSlotIdx + 1;
    triggerAnimation(answerSlotIdx, isCorrect ? "correct" : "wrong");

    if (answer && selectedAnswer) {
      setAnswers((prev) =>
        prev.map((a, idx) => (idx !== answerSlotIdx ? a : selectedAnswer)),
      );
      setVerses((prev) =>
        prev.map((verse) => (verse.id !== selectedAnswer.id ? verse : answer)),
      );
    } else {
      setAnswers((prev) =>
        prev.map((a, idx) => (idx === answerSlotIdx ? selectedAnswer : a)),
      );
      setVerses((prev) =>
        prev.filter((verse) => verse.id !== selectedAnswer.id),
      );
      setSelectedVerse(null);
    }

    if (isCorrect) {
      setScores((prev) => prev + SCORE_INCREASE[difficulty]);
    } else {
      setScores((prev) => prev - 8);
    }
  };

  const removeAnswer = (answerSlotIdx, selectedAnswer) => {
    // Correctly answered slots are locked
    if (selectedAnswer.id === chunkOffset + answerSlotIdx + 1) return;
    setAnswers((prev) =>
      prev.map((answer) =>
        answer === null || answer.id !== selectedAnswer.id ? answer : null,
      ),
    );
    setVerses((prev) => [...prev, selectedAnswer]);
  };

  const toggleSelectVerse = (selected) => {
    if (selectedVerse?.id === selected.id) setSelectedVerse(null);
    else setSelectedVerse(selected);
  };

  // Move a verse from one answer slot to another (drag-to-swap)
  const swapSlots = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    const fromVerse = answers[fromIdx];
    const toVerse = answers[toIdx];

    setAnswers((prev) =>
      prev.map((a, idx) => {
        if (idx === fromIdx) return toVerse;
        if (idx === toIdx) return fromVerse;
        return a;
      }),
    );

    const isCorrect = fromVerse.id === chunkOffset + toIdx + 1;
    triggerAnimation(toIdx, isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setScores((prev) => prev + SCORE_INCREASE[difficulty]);
    } else {
      setScores((prev) => prev - 8);
    }
  };

  // ── Drag & Drop handlers ────────────────────────────────────────────────────
  const handleDragStart = (verse, fromSlotIdx = null) => {
    dragSource.current = { verse, fromSlotIdx };
  };

  const handleSlotDragOver = (e, slotIdx) => {
    e.preventDefault();
    setDragOverSlot(slotIdx);
  };

  const handleSlotDragLeave = () => {
    setDragOverSlot(null);
  };

  const handleDropOnSlot = (e, toSlotIdx) => {
    e.preventDefault();
    setDragOverSlot(null);
    if (!dragSource.current) return;
    const { verse, fromSlotIdx } = dragSource.current;
    dragSource.current = null;
    setSelectedVerse(null);

    if (fromSlotIdx !== null) {
      swapSlots(fromSlotIdx, toSlotIdx);
    } else {
      storeAnswer(toSlotIdx, answers[toSlotIdx], verse);
    }
  };

  const handlePoolDragOver = (e) => {
    e.preventDefault();
    setIsDraggingOverPool(true);
  };

  const handlePoolDragLeave = () => {
    setIsDraggingOverPool(false);
  };

  const handleDropOnPool = (e) => {
    e.preventDefault();
    setIsDraggingOverPool(false);
    if (!dragSource.current) return;
    const { verse, fromSlotIdx } = dragSource.current;
    dragSource.current = null;
    if (fromSlotIdx !== null) removeAnswer(fromSlotIdx, verse);
  };

  const handleDragEnd = () => {
    dragSource.current = null;
    setDragOverSlot(null);
    setIsDraggingOverPool(false);
  };
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    fetch(
      `https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters/id/${chapter}.json`,
    )
      .then((response) => response.json())
      .then((data) => {
        const { verses, ...info } = data;
        const firstChunk = verses.slice(0, PAGE_SIZE);
        const { shuffled, answers } = shuffleVerses(firstChunk, difficulty);
        setData(info);
        setAllVerses(verses);
        setCurrentChunk(0);
        setVerses(shuffled);
        setAnswers(answers);
        setSlotAnimations({});
        setLoading(false);
      });
  }, [chapter, difficulty]);

  useEffect(() => {
    // Check if all slots in the current chunk are correctly answered
    if (verses.length === 0 && data && allVerses.length > 0) {
      const chunkVerses = chunk(allVerses, PAGE_SIZE)[currentChunk];
      const correct = answers.reduce((acc, answer, idx) => {
        if (answer !== null && answer.id === chunkOffset + idx + 1)
          return acc + 1;
        return acc;
      }, 0);

      if (correct !== chunkVerses.length) return;

      const allChunks = chunk(allVerses, PAGE_SIZE);
      const hasNextChunk = currentChunk + 1 < allChunks.length;

      if (hasNextChunk) {
        Modal.success({
          title: `Section ${currentChunk + 1} of ${allChunks.length} complete!`,
          content: `Verses ${chunkOffset + 1}–${chunkOffset + chunkVerses.length} done. Keep going!`,
          okText: `Continue to section ${currentChunk + 2}`,
          onOk: () => {
            const nextIdx = currentChunk + 1;
            const nextVerses = allChunks[nextIdx];
            const { shuffled, answers: newAnswers } = shuffleVerses(
              nextVerses,
              difficulty,
            );
            setCurrentChunk(nextIdx);
            setVerses(shuffled);
            setAnswers(newAnswers);
            setSelectedVerse(null);
            setSlotAnimations({});
          },
        });
      } else {
        Modal.success({
          title: "Congratulations! You have completed this chapter.",
          okText: "Go to the next chapter!",
          onOk: () => {
            setChapter((prev) => prev - 1);
          },
        });
      }
    }
  }, [verses, answers, data, allVerses, currentChunk, chunkOffset, difficulty]);

  const isMultiChapter = chunks.length > 1;

  return (
    <div className="w-screen h-screen bg-[#343a40]">
      <div className="flex justify-between gap-x-4 w-full h-[calc(100%-30px)] p-6">
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
              {/* Section progress — only shown for long surahs */}
              {!loading && isMultiChapter && (
                <span className="mt-1 text-xs font-medium text-gray-400">
                  Section {currentChunk + 1} of {chunks.length} &mdash; verses{" "}
                  {chunkOffset + 1}–{chunkOffset + chunks[currentChunk].length}
                </span>
              )}
            </div>
          </div>
          {/* Content: Ayah Drop Container */}
          <div className="w-full min-h-min flex flex-col gap-y-3 overflow-y-auto rounded p-4 bg-dark-100 text-white">
            {/* Basmalah — only on first section */}
            {(!isMultiChapter || currentChunk === 0) && (
              <div className="w-full flex place-self-center items-center justify-center pb-3 font-arabic border-b border-gray-300">
                <Basmalah className="fill-current text-white h-10" />
              </div>
            )}
            {loading && "Loading..."}
            {!loading &&
              answers.length > 0 &&
              answers.map((answer, idx) => {
                const isLocked =
                  answer !== null && answer.id === chunkOffset + idx + 1;
                const animation = slotAnimations[idx];
                return (
                  <div
                    key={`answer-slot-${idx}`}
                    onClick={() => storeAnswer(idx, answer, selectedVerse)}
                    onDragOver={(e) => handleSlotDragOver(e, idx)}
                    onDragLeave={handleSlotDragLeave}
                    onDrop={(e) => handleDropOnSlot(e, idx)}
                    className={clsx(
                      "flex items-center gap-x-4 px-3 py-3 rounded cursor-pointer transition-colors duration-150",
                      answer === null && "bg-[#262b30]",
                      answer !== null &&
                        answer.id !== chunkOffset + idx + 1 &&
                        difficulty !== "hard" &&
                        "border-dashed border-2 border-red-400",
                      dragOverSlot === idx &&
                        "ring-2 ring-white/50 bg-[#2e3540]",
                      animation === "correct" && "animate-correct",
                      animation === "wrong" && "animate-wrong",
                    )}
                  >
                    {/* Numbering — shows actual verse number */}
                    <div className="rounded-lg font-arabic text-4xl text-center -mt-1">
                      {new Intl.NumberFormat("ar-EG").format(
                        chunkOffset + idx + 1,
                      )}
                    </div>
                    {/* Verse Drop */}
                    {answer === null && (
                      <div className="flex flex-col min-h-[68px] gap-y-1 w-full"></div>
                    )}
                    {answer !== null && (
                      <div
                        draggable={!isLocked}
                        onDragStart={() => handleDragStart(answer, idx)}
                        onDragEnd={handleDragEnd}
                        className={clsx(
                          "flex flex-col gap-y-1 w-full",
                          !isLocked && "cursor-grab active:cursor-grabbing",
                        )}
                      >
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
                <div className="flex items-center justify-center h-[20px] w-[20px] rounded-full bg-dark-100">
                  <UserOutlined className="text-white" />
                </div>
                <span className="block font-semibold">User: {username}</span>
                <EditOutlined className="invisible group-hover:visible" />
              </div>
              {/* Difficulty */}
              <div
                onClick={() => openDialog("difficulty")}
                className="flex items-center gap-x-2 cursor-pointer group"
              >
                <div className="flex items-center justify-center h-[20px] w-[20px] rounded bg-blue-400">
                  <ApartmentOutlined className="text-gray-700" />
                </div>
                <span className="block font-semibold">
                  Difficulty: {upperFirst(difficulty)}
                </span>
                <EditOutlined className="invisible group-hover:visible" />
              </div>
              {/* User Score */}
              <div className="flex items-center gap-x-2">
                <div className="flex items-center justify-center h-[20px] w-[20px] rounded-full bg-yellow-500">
                  <DollarOutlined className="text-yellow-700" />
                </div>
                <span className="block font-semibold">Score: {scores} pts</span>
              </div>
            </div>
            {/* Badge */}
            <Badge scores={scores} />
          </div>
          {/* Content: Un-ordered Ayah Drop Container */}
          <div
            className={clsx(
              "relative w-full min-h-min flex flex-col gap-y-3 overflow-y-auto rounded p-4 bg-dark-100 text-white transition-colors duration-150",
              isDraggingOverPool && "ring-2 ring-white/30",
            )}
            onDragOver={handlePoolDragOver}
            onDragLeave={handlePoolDragLeave}
            onDrop={handleDropOnPool}
          >
            {loading && "Loading..."}
            {!loading && verses.length === 0 && "No verses left"}
            {!loading &&
              verses.length > 0 &&
              verses.map((verse, idx) => {
                return (
                  <div
                    key={`shuffled-${idx}`}
                    draggable
                    onClick={() => toggleSelectVerse(verse)}
                    onDragStart={() => handleDragStart(verse, null)}
                    onDragEnd={handleDragEnd}
                    className={clsx(
                      "flex items-center gap-x-4 px-3 py-3 rounded bg-[#262b30] transition-colors duration-100 ease-linear cursor-grab active:cursor-grabbing",
                      selectedVerse?.id === verse.id && "border-2 border-white",
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
      <div className="flex items-center gap-x-2 justify-center w-full h-[30px] text-sm bg-[#272f33] text-white">
        <p>
          Developed by&nbsp;
          <a
            href="https://github.com/sagwascript"
            target="_blank"
            rel="noopener noreferer"
            className="font-medium hover:underline"
          >
            Muhammad Riza (sagwascript)
          </a>
        </p>
        <span>|</span>
        <p>
          <a
            href="https://github.com/sagwascript/quranqu"
            target="_blank"
            rel="noopener noreferer"
            className="hover:underline"
          >
            Github Repo
          </a>
        </p>
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
