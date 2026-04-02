import React, { useState } from "react";

export const Counter = () => {
  const [count, setCount] = useState(0);

  const handleAdd = () => {
    setCount(prev => prev+1)
  }

    const handleSub = () => {
    setCount(prev => prev - 1)
  }

  return <div><button onClick={handleAdd}>Add</button><button onClick={handleSub}>Add</button><h1>{count}</h1>/div></div>>;
};
