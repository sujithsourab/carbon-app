import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";
import { AppRoutes } from "../types";
import { useForm } from "react-hook-form";

interface LoginFormData {
  email: string;
  password: string;
}

const co2Molecules = Array(10).fill(null).map((_, i) => ({
  left: Math.random() * 100,
  bottom: Math.random() * 60 + 20,
  delay: Math.random() * 3,
  size: Math.random() * 20 + 15,
}));

const trees = Array(80).fill(null).map((_, i) => {
  const greenShade = Math.floor((i / 80) * 3);
  const colors = [
    'rgb(144, 238, 144)', // Light green
    'rgb(34, 139, 34)',   // Forest green
    'rgb(0, 100, 0)'      // Dark green
  ];
  
  return {
    size: Math.random() * 60 + 30,
    left: Math.random() * 100,
    bottom: Math.random() * 40,
    delay: Math.random() * 2,
    opacity: Math.random() * 0.3 + 0.1,
    color: colors[greenShade],
  };
});

export function Landing() {
  const [isLogin, setIsLogin] = React.useState(true);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      if (isLogin) {
        await login(data.email, data.password);
      } else {
        await signup(data.email, data.password, data.email.split("@")[0]);
      }
      navigate(AppRoutes.PORTFOLIO);
    } catch (error) {
      console.error("Authentication error:", error);
    }
  };

  const continueAsGuest = () => {
    navigate(AppRoutes.PORTFOLIO);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-primary-50 to-earth-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* CO2 Molecules */}
      {co2Molecules.map((molecule, index) => (
        <div
          key={`co2-${index}`}
          className="absolute transform-gpu"
          style={{
            left: `${molecule.left}%`,
            top: `${molecule.top}%`,
            opacity: 0,
            animation: `floatCO2 4s ease-in ${molecule.delay}s infinite`,
          }}
        >
          <div className="flex items-center text-gray-600 text-opacity-60 font-semibold"
               style={{ fontSize: `${molecule.size}px` }}>
            CO<sub>2</sub>
          </div>
        </div>
      ))}

      {/* Background Forest */}
      {trees.map((tree, index) => (
        <div
          key={`tree-${index}`}
          className="absolute transform-gpu"
          style={{
            left: `${tree.left}%`,
            bottom: `${tree.bottom}%`,
            opacity: 0,
            animation: `growTree 2s ease-out ${tree.delay}s forwards`,
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${tree.size / 2}px solid transparent`,
              borderRight: `${tree.size / 2}px solid transparent`,
              borderBottom: `${tree.size}px solid ${tree.color}`,
              opacity: tree.opacity,
              transform: 'scale(1, 1.2)',
            }}
          />
          <div
            className="mx-auto"
            style={{
              width: `${tree.size / 8}px`,
              height: `${tree.size / 4}px`,
              backgroundColor: '#4B3621',
            }}
          />
        </div>
      ))}

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="https://drive.google.com/thumbnail?id=1pdNi3JRxVhK2uJ4gJCqMLWYZJm9l3hpW"
              alt="Carbon Projects Logo"
              className="w-24 h-24 object-cover animate-float"
            />
          </div>
          <h1 className="text-3xl font-bold text-primary-700">NbS Carbon Project Management App</h1>
          <p className="mt-2 text-earth-700">Simplify and standardize your carbon project documentation and MRV</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center text-primary-600">
              {isLogin ? "Log in to your account" : "Create new account"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Enter your credentials to access your account"
                : "Sign up to start generating carbon project documentation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                error={errors.email?.message}
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              <Button type="submit" fullWidth>
                {isLogin ? "Log in" : "Sign up"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <div className="text-sm text-gray-500 text-center">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-primary-600 hover:underline"
                onClick={toggleAuthMode}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </div>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>
            <Button
              variant="outline"
              fullWidth
              onClick={continueAsGuest}
            >
              Continue as Guest
            </Button>
          </CardFooter>
        </Card>
      </div>

      <style jsx>{`
        @keyframes growTree {
          0% {
            opacity: 0;
            transform: scale(0) translateY(100px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes floatCO2 {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(1);
          }
          20% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.6;
            transform: translate(var(--tx), var(--ty)) scale(0.8);
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(0.2);
          }
        }
      `}</style>

      {/* Dynamic styles for CO2 molecules */}
      <style>
        {co2Molecules.map((molecule, index) => `
          [key="co2-${index}"] {
            --tx: ${(Math.random() * 200) - 100}px;
            --ty: ${Math.random() * 300 + 100}px;
          }
        `).join('\n')}
      </style>
    </div>
  );
}