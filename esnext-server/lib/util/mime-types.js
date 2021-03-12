"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentType = exports.CSS_CONTENT_TYPE = exports.SCSS_CONTENT_TYPE = exports.SASS_CONTENT_TYPE = exports.HTML_CONTENT_TYPE = exports.TYPESCRIPT_CONTENT_TYPE = exports.JAVASCRIPT_CONTENT_TYPE = exports.TEXT_CONTENT_TYPE = exports.JSON_CONTENT_TYPE = void 0;
const mime_db_1 = __importDefault(require("mime-db"));
exports.JSON_CONTENT_TYPE = "application/json; charset=UTF-8";
exports.TEXT_CONTENT_TYPE = "text/plain; charset=UTF-8";
exports.JAVASCRIPT_CONTENT_TYPE = "application/javascript; charset=UTF-8";
exports.TYPESCRIPT_CONTENT_TYPE = "application/x-typescript; charset=UTF-8";
exports.HTML_CONTENT_TYPE = "text/html; charset=UTF-8";
exports.SASS_CONTENT_TYPE = "text/x-sass; charset=UTF-8";
exports.SCSS_CONTENT_TYPE = "text/x-scss; charset=UTF-8";
exports.CSS_CONTENT_TYPE = "text/css; charset=UTF-8";
const mimeTypes = new Map();
for (const contentType of Object.getOwnPropertyNames(mime_db_1.default)) {
    const mimeType = mime_db_1.default[contentType];
    if (mimeType.extensions)
        for (const ext of mimeType.extensions) {
            mimeTypes.set(ext, mimeType);
            mimeType.contentType = `${contentType}; charset=${mimeType.charset || "UTF-8"}`;
        }
}
const JAVASCRIPT_MIME_TYPE = mimeTypes.get("js");
JAVASCRIPT_MIME_TYPE.extensions.push("jsx");
mimeTypes.set("jsx", JAVASCRIPT_MIME_TYPE);
const TYPESCRIPT_MIME_TYPE = {
    "source": "unknown",
    "charset": "UTF-8",
    "compressible": true,
    "extensions": ["ts", "tsx"],
    "contentType": "application/x-typescript; charset=UTF-8"
};
mimeTypes.set("ts", TYPESCRIPT_MIME_TYPE);
mimeTypes.set("tsx", mimeTypes.get("ts"));
function contentType(filename = "") {
    const mimeType = mimeTypes.get(filename);
    if (mimeType) {
        return mimeType.contentType;
    }
    const dot = filename.lastIndexOf(".") + 1;
    if (dot > 0) {
        const mimeType = mimeTypes.get(filename.substring(dot));
        if (mimeType) {
            return mimeType.contentType;
        }
    }
}
exports.contentType = contentType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWltZS10eXBlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy91dGlsL21pbWUtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsc0RBQXlCO0FBRVosUUFBQSxpQkFBaUIsR0FBRyxpQ0FBaUMsQ0FBQztBQUN0RCxRQUFBLGlCQUFpQixHQUFHLDJCQUEyQixDQUFDO0FBQ2hELFFBQUEsdUJBQXVCLEdBQUcsdUNBQXVDLENBQUM7QUFDbEUsUUFBQSx1QkFBdUIsR0FBRyx5Q0FBeUMsQ0FBQztBQUNwRSxRQUFBLGlCQUFpQixHQUFHLDBCQUEwQixDQUFDO0FBQy9DLFFBQUEsaUJBQWlCLEdBQUcsNEJBQTRCLENBQUM7QUFDakQsUUFBQSxpQkFBaUIsR0FBRyw0QkFBNEIsQ0FBQztBQUNqRCxRQUFBLGdCQUFnQixHQUFHLHlCQUF5QixDQUFDO0FBRTFELE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7QUFFNUIsS0FBSyxNQUFNLFdBQVcsSUFBSSxNQUFNLENBQUMsbUJBQW1CLENBQUMsaUJBQUUsQ0FBQyxFQUFFO0lBQ3RELE1BQU0sUUFBUSxHQUFHLGlCQUFFLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDakMsSUFBSSxRQUFRLENBQUMsVUFBVTtRQUFFLEtBQUssTUFBTSxHQUFHLElBQUksUUFBUSxDQUFDLFVBQVUsRUFBRTtZQUM1RCxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM3QixRQUFRLENBQUMsV0FBVyxHQUFHLEdBQUcsV0FBVyxhQUFhLFFBQVEsQ0FBQyxPQUFPLElBQUksT0FBTyxFQUFFLENBQUM7U0FDbkY7Q0FDSjtBQUVELE1BQU0sb0JBQW9CLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqRCxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDLENBQUM7QUFFM0MsTUFBTSxvQkFBb0IsR0FBRztJQUN6QixRQUFRLEVBQUUsU0FBUztJQUNuQixTQUFTLEVBQUUsT0FBTztJQUNsQixjQUFjLEVBQUUsSUFBSTtJQUNwQixZQUFZLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDO0lBQzNCLGFBQWEsRUFBRSx5Q0FBeUM7Q0FDM0QsQ0FBQztBQUNGLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDLENBQUM7QUFDMUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBRTFDLFNBQWdCLFdBQVcsQ0FBQyxRQUFRLEdBQUcsRUFBRTtJQUNyQyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3pDLElBQUksUUFBUSxFQUFFO1FBQ1YsT0FBTyxRQUFRLENBQUMsV0FBVyxDQUFDO0tBQy9CO0lBQ0QsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDMUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFO1FBQ1QsTUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEQsSUFBSSxRQUFRLEVBQUU7WUFDVixPQUFPLFFBQVEsQ0FBQyxXQUFXLENBQUM7U0FDL0I7S0FDSjtBQUNMLENBQUM7QUFaRCxrQ0FZQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBkYiBmcm9tIFwibWltZS1kYlwiO1xyXG5cclxuZXhwb3J0IGNvbnN0IEpTT05fQ09OVEVOVF9UWVBFID0gXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PVVURi04XCI7XHJcbmV4cG9ydCBjb25zdCBURVhUX0NPTlRFTlRfVFlQRSA9IFwidGV4dC9wbGFpbjsgY2hhcnNldD1VVEYtOFwiO1xyXG5leHBvcnQgY29uc3QgSkFWQVNDUklQVF9DT05URU5UX1RZUEUgPSBcImFwcGxpY2F0aW9uL2phdmFzY3JpcHQ7IGNoYXJzZXQ9VVRGLThcIjtcclxuZXhwb3J0IGNvbnN0IFRZUEVTQ1JJUFRfQ09OVEVOVF9UWVBFID0gXCJhcHBsaWNhdGlvbi94LXR5cGVzY3JpcHQ7IGNoYXJzZXQ9VVRGLThcIjtcclxuZXhwb3J0IGNvbnN0IEhUTUxfQ09OVEVOVF9UWVBFID0gXCJ0ZXh0L2h0bWw7IGNoYXJzZXQ9VVRGLThcIjtcclxuZXhwb3J0IGNvbnN0IFNBU1NfQ09OVEVOVF9UWVBFID0gXCJ0ZXh0L3gtc2FzczsgY2hhcnNldD1VVEYtOFwiO1xyXG5leHBvcnQgY29uc3QgU0NTU19DT05URU5UX1RZUEUgPSBcInRleHQveC1zY3NzOyBjaGFyc2V0PVVURi04XCI7XHJcbmV4cG9ydCBjb25zdCBDU1NfQ09OVEVOVF9UWVBFID0gXCJ0ZXh0L2NzczsgY2hhcnNldD1VVEYtOFwiO1xyXG5cclxuY29uc3QgbWltZVR5cGVzID0gbmV3IE1hcCgpO1xyXG5cclxuZm9yIChjb25zdCBjb250ZW50VHlwZSBvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhkYikpIHtcclxuICAgIGNvbnN0IG1pbWVUeXBlID0gZGJbY29udGVudFR5cGVdO1xyXG4gICAgaWYgKG1pbWVUeXBlLmV4dGVuc2lvbnMpIGZvciAoY29uc3QgZXh0IG9mIG1pbWVUeXBlLmV4dGVuc2lvbnMpIHtcclxuICAgICAgICBtaW1lVHlwZXMuc2V0KGV4dCwgbWltZVR5cGUpO1xyXG4gICAgICAgIG1pbWVUeXBlLmNvbnRlbnRUeXBlID0gYCR7Y29udGVudFR5cGV9OyBjaGFyc2V0PSR7bWltZVR5cGUuY2hhcnNldCB8fCBcIlVURi04XCJ9YDtcclxuICAgIH1cclxufVxyXG5cclxuY29uc3QgSkFWQVNDUklQVF9NSU1FX1RZUEUgPSBtaW1lVHlwZXMuZ2V0KFwianNcIik7XHJcbkpBVkFTQ1JJUFRfTUlNRV9UWVBFLmV4dGVuc2lvbnMucHVzaChcImpzeFwiKTtcclxubWltZVR5cGVzLnNldChcImpzeFwiLCBKQVZBU0NSSVBUX01JTUVfVFlQRSk7XHJcblxyXG5jb25zdCBUWVBFU0NSSVBUX01JTUVfVFlQRSA9IHtcclxuICAgIFwic291cmNlXCI6IFwidW5rbm93blwiLFxyXG4gICAgXCJjaGFyc2V0XCI6IFwiVVRGLThcIixcclxuICAgIFwiY29tcHJlc3NpYmxlXCI6IHRydWUsXHJcbiAgICBcImV4dGVuc2lvbnNcIjogW1widHNcIiwgXCJ0c3hcIl0sXHJcbiAgICBcImNvbnRlbnRUeXBlXCI6IFwiYXBwbGljYXRpb24veC10eXBlc2NyaXB0OyBjaGFyc2V0PVVURi04XCJcclxufTtcclxubWltZVR5cGVzLnNldChcInRzXCIsIFRZUEVTQ1JJUFRfTUlNRV9UWVBFKTtcclxubWltZVR5cGVzLnNldChcInRzeFwiLCBtaW1lVHlwZXMuZ2V0KFwidHNcIikpO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbnRlbnRUeXBlKGZpbGVuYW1lID0gXCJcIikge1xyXG4gICAgY29uc3QgbWltZVR5cGUgPSBtaW1lVHlwZXMuZ2V0KGZpbGVuYW1lKTtcclxuICAgIGlmIChtaW1lVHlwZSkge1xyXG4gICAgICAgIHJldHVybiBtaW1lVHlwZS5jb250ZW50VHlwZTtcclxuICAgIH1cclxuICAgIGNvbnN0IGRvdCA9IGZpbGVuYW1lLmxhc3RJbmRleE9mKFwiLlwiKSArIDE7XHJcbiAgICBpZiAoZG90ID4gMCkge1xyXG4gICAgICAgIGNvbnN0IG1pbWVUeXBlID0gbWltZVR5cGVzLmdldChmaWxlbmFtZS5zdWJzdHJpbmcoZG90KSk7XHJcbiAgICAgICAgaWYgKG1pbWVUeXBlKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBtaW1lVHlwZS5jb250ZW50VHlwZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19