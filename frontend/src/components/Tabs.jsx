import React, { createContext, useContext, useState } from 'react';

const MyContext = createContext();

const MyComponent = () => {
  const [count, setCount] = useState(0);

  return (
    <MyContext.Provider value={{ count, setCount }}>
      <ChildComponent />
    </MyContext.Provider>
  );
};

const ChildComponent = () => {
  const { count, setCount } = useContext(MyContext);

  const increment = () => {
    setCount(count + 1);frontend/src/components/Tabs.jsx
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
};

export default MyComponent;