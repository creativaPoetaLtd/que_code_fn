"use client";

import { Button } from "antd";
import { useState } from "react";
import { Input } from "antd";
import { Checkbox } from "antd";

const SignInForm = () => {

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [formValues, setFormValues] = useState({ email: "", password: "" });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
   
  };

  return (
    <div className="max-h-screen w-full">
      <form onSubmit={onSubmit} className="w-full">
        <div className="mt-4">
          <label className="text-[#030229c4]">Email</label>
          <Input
            name="email"
            placeholder="Type here ..."
            value={formValues.email}
            onChange={handleInputChange}
            className="rounded-lg"
          />
        </div>
        <div className="mt-10 relative">
          <label className="text-[#030229c4]">Password</label>
          <span className="text-[#030229c4] text-[12px] float-right mr-5 text-[#2179B8] cursor-pointer">
            Forget password?
          </span>
          <Input
            name="password"
            type={passwordVisible ? "text" : "password"}
            placeholder="Enter your password"
            value={formValues.password}
            onChange={handleInputChange}
            className="rounded-lg"
          />
          <span
            onClick={() => setPasswordVisible(!passwordVisible)}
            className="cursor-pointer absolute right-4 top-[60%] transform -translate-y-1/2"
          >
            {passwordVisible ? "👁️" : "👁️‍🗨️"}
          </span>
        </div>
        <div className="flex items-center mt-8 space-x-2">
          <Checkbox id="terms" />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none"
          >
            Remember me
          </label>
        </div>
        <Button
          className="mt-5 w-full bg-[#2179B8] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sign In
        </Button>
      </form>
    </div>
  );
};

export default SignInForm;
