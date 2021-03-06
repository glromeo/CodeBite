"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const configure_1 = require("./configure");
const server_1 = require("./server");
exports.default = {
    configure: configure_1.configure,
    startServer: server_1.startServer
};
__exportStar(require("./messaging"), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQUEsMkNBQXNDO0FBQ3RDLHFDQUFxQztBQUVyQyxrQkFBZTtJQUNYLFNBQVMsRUFBVCxxQkFBUztJQUNULFdBQVcsRUFBWCxvQkFBVztDQUNkLENBQUM7QUFFRiw4Q0FBNEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2NvbmZpZ3VyZX0gZnJvbSBcIi4vY29uZmlndXJlXCI7XHJcbmltcG9ydCB7c3RhcnRTZXJ2ZXJ9IGZyb20gXCIuL3NlcnZlclwiO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQge1xyXG4gICAgY29uZmlndXJlLFxyXG4gICAgc3RhcnRTZXJ2ZXJcclxufTtcclxuXHJcbmV4cG9ydCAqIGZyb20gXCIuL21lc3NhZ2luZ1wiOyJdfQ==