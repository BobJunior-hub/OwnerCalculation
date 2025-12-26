import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MailOutlined, LockOutlined, UserAddOutlined } from "@ant-design/icons";
import { login, setAuthToken } from "./api";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (!identifier || !password) {
        setErrorMsg("Please enter your username and password");
        setLoading(false);
        return;
      }

      const { token, user } = await login(identifier, password);
      
      const userData = user ? { ...user } : {};
      userData.username = identifier;
      
      if (remember) {
        setAuthToken(token, true);
        localStorage.removeItem("user");
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setAuthToken(token, false);
        sessionStorage.removeItem("user");
        sessionStorage.setItem("user", JSON.stringify(userData));
      }

        navigate("/menu");
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gray-100 m-0 p-0">
      <div className="bg-white p-8 rounded-lg shadow-md w-[400px] max-w-[90%]">
        <h1 className="text-2xl font-bold text-center mb-2 text-gray-800">Sign in</h1>
        <p className="text-gray-600 text-center mb-6">Enter your username and password!</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errorMsg && <p className="text-red-500 m-0 text-sm">{errorMsg}</p>}
          <div className="flex items-center gap-2 p-2 border border-gray-300 rounded">
            <UserAddOutlined/>
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Username" type="username" className="flex-1 border-none outline-none text-base" />
          </div>
          <div className="flex items-center gap-2 p-2 border border-gray-300 rounded">
            <LockOutlined className="text-gray-400" />
            <input value={password} type={showPass ? "text" : "password"} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="flex-1 border-none outline-none text-base" />
            <button type="button" onClick={() => setShowPass(!showPass)} className="bg-transparent border-none cursor-pointer text-orange-300 text-sm">{showPass ? "Hide" : "Show"}</button>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
            Remember me
          </label>
          <button type="submit" disabled={loading} className={`px-3 py-3 bg-[#E77843] hover:bg-[#F59A6B] text-white border-none rounded text-base font-medium transition-colors ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>{loading ? "Loading..." : "Sign in"}</button>
        </form>
      </div>
    </div>
    
  );
}
