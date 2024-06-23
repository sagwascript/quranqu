import { Modal } from "antd";
import { useEffect, useState } from "react";

// eslint-disable-next-line react/prop-types
function DialogDifficulty({ difficulty, isOpen, onClose, onSubmit }) {
  const [selected, setSelected] = useState("easy");
  useEffect(() => {
    if (isOpen) setSelected(difficulty);
  }, [isOpen, difficulty]);
  return (
    <Modal
      title="Change Difficulty"
      open={isOpen}
      onOk={() => onSubmit(selected)}
      onCancel={onClose}
      okText="Save"
    >
      <select
        name="difficulty"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="rounded px-3 py-2 bg-gray100 w-full"
      >
        <option value="easy">Easy</option>
        <option value="medium">Medium</option>
        <option value="hard">Hard</option>
      </select>
    </Modal>
  );
}

export default DialogDifficulty;
