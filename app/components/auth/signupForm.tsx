"use client";

import { Input, notification } from "antd";
import { useState } from "react";
import { Button } from "antd/es/radio";

const SignUpForm = () => {
  const [formValues, setFormValues] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const validateForm = () => {
    const { email, firstName, lastName, phoneNumber, password, confirmPassword } = formValues;
    if (!email.includes("@")) {
      return "Email must be valid.";
    }
    if (firstName.length < 3) {
      return "First name must be at least 3 characters.";
    }
    if (lastName.length < 3) {
      return "Last name must be at least 3 characters.";
    }
    if (phoneNumber.length < 10) {
      return "Phone number must be at least 10 digits.";
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one digit.";
    }
    if (password !== confirmPassword) {
      return "Confirm password must match the password.";
    }
    return null;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setErrorMessage(error);
      notification.error({ message: error });
    } else {
      console.log("Form Values:", formValues);
      setErrorMessage(null);
      notification.success({ message: "Form submitted successfully!" });
    }
  };

  return (
    <>
      {errorMessage && <div className="alert alert-danger text-[red]">{errorMessage}</div>}

      <form onSubmit={onSubmit} className="w-full">
        <div className="flex w-full mt-6">
          <div className="w-1/2 mr-2">
            <label className="text-[#030229c4]">First Name</label>
            <Input
              name="firstName"
              placeholder="Enter first name"
              value={formValues.firstName}
              onChange={handleChange}
              className="rounded-lg"
            />
          </div>
          <div className="w-1/2 ml-2">
            <label className="text-[#030229c4]">Last Name</label>
            <Input
              name="lastName"
              placeholder="Enter last name"
              value={formValues.lastName}
              onChange={handleChange}
              className="rounded-lg"
            />
          </div>
        </div>

        <div className="mt-2">
          <label className="text-[#030229c4]">Email</label>
          <Input
            name="email"
            placeholder="Enter email address"
            value={formValues.email}
            onChange={handleChange}
            className="rounded-lg"
            type="email"
          />
        </div>

        <div className="mt-2">
          <label className="text-[#030229c4]">Phone Number</label>
          <Input
            name="phoneNumber"
            placeholder="Enter your phone number"
            value={formValues.phoneNumber}
            onChange={handleChange}
            className="rounded-lg"
          />
        </div>

        <div className="flex w-full mt-2">
          <div className="w-1/2 mr-2">
            <label className="text-[#030229c4]">Password</label>
            <div className="relative">
              <Input
                name="password"
                type={passwordVisible ? "text" : "password"}
                placeholder="Enter your password"
                value={formValues.password}
                onChange={handleChange}
                className="rounded-lg"
              />
              <span
                onClick={() => setPasswordVisible(!passwordVisible)}
                className="cursor-pointer absolute right-4 top-[60%] transform -translate-y-1/2"
              >
                {passwordVisible ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>

          <div className="w-1/2 ml-2">
            <label className="text-[#030229c4]">Confirm Password</label>
            <div className="relative">
              <Input
                name="confirmPassword"
                type={confirmPasswordVisible ? "text" : "password"}
                placeholder="Retype password"
                value={formValues.confirmPassword}
                onChange={handleChange}
                className="rounded-lg"
              />
              <span
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                className="cursor-pointer absolute right-4 top-[60%] transform -translate-y-1/2"
              >
                {confirmPasswordVisible ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="mt-7 w-full bg-[#2179B8] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit
        </Button>
      </form>
    </>
  );
};

export default SignUpForm;
