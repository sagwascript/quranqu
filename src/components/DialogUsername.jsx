import { Modal } from "antd";
import { useEffect, useState } from "react";

// eslint-disable-next-line react/prop-types
function DialogUsername({ username, isOpen, onClose, onSubmit }) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (isOpen) setText(username);
  }, [isOpen, username]);
  return (
    <Modal
      title="Change Username"
      open={isOpen}
      onOk={() => onSubmit(text)}
      onCancel={onClose}
      okText="Save"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="rounded px-3 py-2 bg-gray-100 w-full"
      />
    </Modal>
  );
}

export default DialogUsername;
