import { TrophyFilled } from "@ant-design/icons";
import clsx from "clsx";

// eslint-disable-next-line react/prop-types
function Badge({ scores }) {
  return (
    <div className="flex items-center justify-center w-[90px] h-[90px] rounded-md bg-[#262b30]">
      <TrophyFilled
        className={clsx(
          scores < 500 && "text-[#6a3805] ",
          scores >= 500 && scores < 1000 && "text-gray-500",
          scores >= 2500 && "text-[#c9b037]",
          "text-[75px]"
        )}
      />
    </div>
  );
}

export default Badge;
