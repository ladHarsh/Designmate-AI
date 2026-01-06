import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/api";

const Profile = () => {
  const { user, updateProfile, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  // Parse name from database
  const parseName = (fullName) => {
    if (!fullName) return { firstName: "", lastName: "" };
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    const lastName = parts.pop();
    const firstName = parts.join(" ");
    return { firstName, lastName };
  };

  const { firstName: userFirstName, lastName: userLastName } = parseName(
    user?.name
  );

  const [formData, setFormData] = useState({
    firstName: userFirstName || "",
    lastName: userLastName || "",
    email: user?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      const { firstName, lastName } = parseName(user.name);
      setFormData({
        firstName: firstName || "",
        lastName: lastName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError("");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(formData);
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess("Password changed successfully!");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to change password. Please check your current password.";
      setPasswordError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <UserIcon className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">
              Profile Settings
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Update your profile information and manage your account.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors font-medium ${
                    activeTab === "profile"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <UserIcon className="h-5 w-5" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors font-medium ${
                    activeTab === "security"
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <LockClosedIcon className="h-5 w-5" />
                  <span>Security</span>
                </button>
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={logout}
                  className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "profile" ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-xl p-8"
                >
                  {/* Profile Picture Section */}
                  <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-gray-200">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {userFirstName?.charAt(0)?.toUpperCase() || "U"}
                      {userLastName?.charAt(0)?.toUpperCase() || ""}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {user?.name || "User"}
                      </h2>
                      <p className="text-gray-600">{user?.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {user?.profession || "Designer"} •{" "}
                        {user?.role || "user"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Member since{" "}
                        {user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "Today"}
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-xl p-8"
                >
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Change Password
                  </h3>

                  {passwordError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                      {passwordSuccess}
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Password requirements:</strong>
                      </p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li>✓ Minimum 8 characters</li>
                        <li>✓ Mix of uppercase and lowercase letters</li>
                        <li>✓ At least one number</li>
                      </ul>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {isLoading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
