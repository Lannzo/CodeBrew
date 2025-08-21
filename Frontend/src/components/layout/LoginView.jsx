import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ROLES, LS_KEYS, readLS, writeLS } from "../../helpers/localStorageUtils";
import loginImage from "/src/assets/login-photo.jpg";
import coffeeLogo from "/src/assets/coffee-logo.png";

const HARD_CODED_ADMIN = {
  username: "admin",
  password: "admin123",
  role: "admin",
};

// Validation schema
const LoginSchema = Yup.object().shape({
  username: Yup.string().required("Username is required"),
  password: Yup.string().required("Password is required"),
  role: Yup.string().required("Role is required"),
  remember: Yup.boolean(),
});

export default function LoginView({ onLogin }) {
  const handleSubmit = (values, { setSubmitting }) => {
    const { username, password, role, remember } = values;

    // Admin login
    if (
      username === HARD_CODED_ADMIN.username &&
      password === HARD_CODED_ADMIN.password &&
      role === "admin"
    ) {
      toast.success("Welcome back, Admin!");
      if (remember) writeLS(LS_KEYS.lastUser, { username, role });
      setSubmitting(false);
      return onLogin(HARD_CODED_ADMIN.role);
    }

    // Branch users login
    const branches = readLS(LS_KEYS.branches, []);
    let foundUser = null;
    for (const b of branches) {
      const u = b.users?.find(
        (user) =>
          user.username === username &&
          user.password === password &&
          user.role === role
      );
      if (u) {
        foundUser = { ...u, branch: b };
        break;
      }
    }

    if (!foundUser) {
      toast.error("Invalid credentials for selected role.");
      setSubmitting(false);
      return;
    }

    toast.success(`Welcome ${foundUser.username}!`);
    if (remember) writeLS(LS_KEYS.lastUser, { username, role });
    setSubmitting(false);
    onLogin(foundUser.role, foundUser.branch);
  };

  // Prefill if last user exists
  const lastUser = readLS(LS_KEYS.lastUser, null);

  return (
    <div className="flex h-screen">
      {/* Right form */}
      <div className="flex w-full md:w-1/2 h-full items-center justify-center bg-white">
        <Formik
          initialValues={{
            username: lastUser?.username || "",
            password: "",
            role: lastUser?.role || "cashier",
            remember: !!lastUser,
          }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="w-[360px] bg-white rounded-2xl space-y-4 p-6 border hover:shadow-lg">
              <div className=" flex justify-center">
                <img src={coffeeLogo} alt="coffee" className="w-40 h-34" />
              </div>
              <h2 className="text-3xl text-amber-950 font-bold text-center mb-7">-Code Brew-  Management System</h2>
              <h4 className="text-2xl text-amber-950 font-semibold ">Sign in:</h4>

              {/* Username */}
              <Field
                name="username"
                className="w-full border rounded-xl px-3 py-2"
                placeholder="Username"
              />
              <ErrorMessage name="username" component="div" className="text-red-500 text-sm" />

              {/* Password */}
              <Field
                type="password"
                name="password"
                className="w-full border rounded-xl px-3 py-2"
                placeholder="Password"
              />
              <ErrorMessage name="password" component="div" className="text-red-500 text-sm" />

              {/* Role */}
              <span className="ml-1 text-amber-900 font-semibold">Select a Role:</span>
              <Field
                as="select"
                name="role"
                className="w-full border rounded-xl px-3 py-2 capitalize"
              >
                {[...ROLES].map((r) => (
                  <option key={r} value={r} className="capitalize">
                    {r}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="role" component="div" className="text-red-500 text-sm" />

              {/* Remember Me */}
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <Field type="checkbox" name="remember" className="h-4 w-4" />
                Remember me
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-amber-700 text-black rounded-xl py-2.5 hover:bg-amber-800 transition"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>
            </Form>
          )}
        </Formik>
      </div>

      {/* Left image */}
      <div className="hidden md:block md:w-1/2 h-full">
  
        <img src={loginImage} alt="Login" className="w-full h-full object-cover" />

      </div>

      {/*  Toast container */}
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />
    </div>
  );
}
