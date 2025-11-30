
export var UserRole;
(function (UserRole) {
    UserRole["EMPLOYEE"] = "employee";
    UserRole["LINE_MANAGER"] = "line_manager";
    UserRole["HR_MANAGER"] = "hr_manager";
    UserRole["HR_ANALYST"] = "hr_analyst";
    UserRole["RECRUITER"] = "recruiter";
    UserRole["ADMIN"] = "admin";
})(UserRole || (UserRole = {}));

export var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["ON_LEAVE"] = "on_leave";
    UserStatus["TERMINATED"] = "terminated";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (UserStatus = {}));

export var Department;
(function (Department) {
    Department["IT"] = "it";
    Department["HR"] = "hr";
    Department["FINANCE"] = "finance";
    Department["SALES"] = "sales";
    Department["MARKETING"] = "marketing";
    Department["OPERATIONS"] = "operations";
    Department["SUPPORT"] = "support";
})(Department || (Department = {}));

export var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "full_time";
    EmploymentType["PART_TIME"] = "part_time";
    EmploymentType["CONTRACT"] = "contract";
    EmploymentType["INTERN"] = "intern";
})(EmploymentType || (EmploymentType = {}));
