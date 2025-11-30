import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider } from "./stores/RootStore";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EmployeeManagement from "./pages/EmployeeManagement";
import OrganizationStructure from "./pages/OrganizationStructure";
import EmployeeSelfService from "./pages/EmployeeSelfService";
import LeaveApprovals from "./pages/LeaveApprovals";
import GoalsManagement from "./pages/GoalsManagement";
import MyGoals from "./pages/MyGoals";
import ReviewTemplates from "./pages/ReviewTemplates";
import PerformanceReviews from "./pages/PerformanceReviews";
import MyReviews from "./pages/MyReviews";
import HighPotentialEmployees from "./pages/HighPotentialEmployees";
import RecruitmentPipeline from "./pages/RecruitmentPipeline";
import CandidateDetails from "./pages/CandidateDetails";
import NewCandidate from "./pages/NewCandidate";
import Offers from "./pages/Offers";
import Reports from "./pages/Reports";
import SkillsGapAnalysis from "./pages/SkillsGapAnalysis";
import SkillsManagement from "./pages/SkillsManagement";
import JobProfilesManagement from "./pages/JobProfilesManagement";
import SalaryBiasAnalysis from "./pages/SalaryBiasAnalysis";
import SalaryWarnings from "./pages/SalaryWarnings";
import ReviewCommentsSentimentPage from "./pages/ReviewCommentsSentimentPage";
import AttritionRisk from "./pages/AttritionRisk";
import PerformancePotentialMatrix from "./pages/PerformancePotentialMatrix";
import TimeTracking from "./pages/TimeTracking";
import Payroll from "./pages/Payroll";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  return (
    <Router>
      <StoreProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <EmployeeManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/organization"
            element={
              <ProtectedRoute>
                <OrganizationStructure />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-profile"
            element={
              <ProtectedRoute>
                <EmployeeSelfService />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leave-approvals"
            element={
              <ProtectedRoute>
                <LeaveApprovals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <GoalsManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-goals"
            element={
              <ProtectedRoute>
                <MyGoals />
              </ProtectedRoute>
            }
          />

          <Route
            path="/review-templates"
            element={
              <ProtectedRoute>
                <ReviewTemplates />
              </ProtectedRoute>
            }
          />

          <Route
            path="/performance-reviews"
            element={
              <ProtectedRoute>
                <PerformanceReviews />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-reviews"
            element={
              <ProtectedRoute>
                <MyReviews />
              </ProtectedRoute>
            }
          />

          <Route
            path="/high-potential"
            element={
              <ProtectedRoute>
                <HighPotentialEmployees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recruitment"
            element={
              <ProtectedRoute>
                <RecruitmentPipeline />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recruitment/offers"
            element={
              <ProtectedRoute>
                <Offers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recruitment/new"
            element={
              <ProtectedRoute>
                <NewCandidate />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recruitment/:id"
            element={
              <ProtectedRoute>
                <CandidateDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/skills-gap-analysis"
            element={
              <ProtectedRoute>
                <SkillsGapAnalysis />
              </ProtectedRoute>
            }
          />

          <Route
            path="/skills-management"
            element={
              <ProtectedRoute>
                <SkillsManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/job-profiles"
            element={
              <ProtectedRoute>
                <JobProfilesManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/salary-bias-analysis"
            element={
              <ProtectedRoute>
                <SalaryBiasAnalysis />
              </ProtectedRoute>
            }
          />

          <Route
            path="/salary-warnings"
            element={
              <ProtectedRoute>
                <SalaryWarnings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/review-comments-sentiment"
            element={
              <ProtectedRoute>
                <ReviewCommentsSentimentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics/attrition"
            element={
              <ProtectedRoute>
                <AttritionRisk />
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics/performance-potential"
            element={
              <ProtectedRoute>
                <PerformancePotentialMatrix />
              </ProtectedRoute>
            }
          />

          <Route
            path="/time-tracking"
            element={
              <ProtectedRoute>
                <TimeTracking />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payroll"
            element={
              <ProtectedRoute>
                <Payroll />
              </ProtectedRoute>
            }
          />

          
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </StoreProvider>
    </Router>
  );
}

export default App;
