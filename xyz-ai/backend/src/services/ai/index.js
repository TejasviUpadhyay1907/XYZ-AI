const toolRegistry = require('./ToolRegistry');

// Import tools
const { AttendanceToolDef, attendanceHandler } = require('./tools/attendanceTool');
const { EscalationToolDef, escalationHandler } = require('./tools/escalationTool');
const { AnalyticsToolDef, analyticsHandler } = require('./tools/analyticsTool');
const { MarkAttendanceToolDef, markAttendanceHandler } = require('./tools/markAttendanceTool');

// Register tools
toolRegistry.register(AttendanceToolDef, attendanceHandler);
toolRegistry.register(EscalationToolDef, escalationHandler);
toolRegistry.register(AnalyticsToolDef, analyticsHandler);
toolRegistry.register(MarkAttendanceToolDef, markAttendanceHandler);

module.exports = toolRegistry;