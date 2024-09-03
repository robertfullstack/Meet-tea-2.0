import { React, useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";

import LoginRegistro from "./screens/LoginRegistro";
import Home from './screens/Home';

const App = () => {
  const [user, setUser] = useState();


  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginRegistro setUser={setUser} user={user} />} />
        <Route path="/home" element={<Home setUser={setUser} user={user} />} />
      </Routes>
    </Router>
  )
}


export default App;