import React, { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

const RootLayout = ({ children }: Props) => {
  return (
    <div>
      <div className="this is good">this is good</div>
      {children}
    </div>
  );
};

export default RootLayout;
