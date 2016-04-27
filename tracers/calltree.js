
var traceDepth = 0;
var eventQueue = [];
var nodes = {};

var definePropertyNodes = {};

var time = function() { return 0; };
if (global.android) {
	var sys = java.lang.System;
	time = function() { return sys.nanoTime() / 1000000; }
} else {
	time = function() { return CACurrentMediaTime() * 1000; }
}

if (typeof __tracer !== 'undefined') {
	console.log("The " + module.id + " is required, but __tracer was allready defined in global.");
} else {
	__tracer = {};
	var methods = ["add", "addSourceMap", "traceFileEntry", "traceFileExit", "setGlobal", "traceFunCreate", "traceEnter", "traceExit", "traceReturnValue", "traceExceptionThrown", "bailThisTick", "pushEpoch", "popEpoch", "augmentjQuery", "version", "connect", "nodes", "trackNodes", "untrackNodes", "newNodes", "trackHits", "trackExceptions", "trackLogs", "trackEpochs", "untrackEpochs", "trackFileCallGraph", "untrackFileCallGraph", "fileCallGraphDelta", "hitCountDeltas", "newExceptions", "epochDelta", "logCount", "logDelta", "backtrace"];
	for (var i = 0; i < methods.length; i++) {
		__tracer[methods[i]] = (function(method) { return function () {
			return arguments[0];
		}})(methods[i]);
	}
	
	var maxSpace = 64;
	var space = "";
	for (var i = 0; i < maxSpace; i++) {
		space += " ";
	}
	
	var depth = 0;
	function indent() {
		return space.substr(0, depth);
	}
	
	__tracer.add = function(info, data) {
		if (data.nodes) {
			var propertyDefinitions = [];
			var gettersAndSetters = [];
			data.nodes.forEach(function(node) {
				nodes[node.id] = node;
				if (node.name === "Object.defineProperty" && node.type === "callsite") {
					var propDef = { node: node, get: undefined, set: undefined };
					propertyDefinitions.push(propDef);
					definePropertyNodes[node.id] = propDef;
				} else if ((node.name === "get" || node.name === "set") && node.type === "function") {
					gettersAndSetters.push(node);
				}
			});
			gettersAndSetters.forEach(function(node) {
				for (var i = 0; i < propertyDefinitions.length; i++) {
					var propDef = propertyDefinitions[i];
					var propDefNode = propDef.node;
					// that contains get/set node
					if ((propDefNode.start.line < node.start.line || (propDefNode.start.line == node.start.line && propDefNode.start.column <= node.start.column)) &&
						(node.end.line < propDefNode.end.line || (node.end.line == propDefNode.end.line && node.end.column <= propDefNode.end.column))) {
						// will set that node's name once called with propety name
						if (node.name === "get") {
							propDef.get = node.id;
						} else {
							propDef.set = node.id;
						}
						break;
					}
				}
			});
		}
		return info;
	}
	
	__tracer.traceFileEntry = function(info) {
		return info;
	}
	
	__tracer.traceFileExit = function(info) {
		return info;
	}
	
	__tracer.traceEnter = function(info) {
		if (traceDepth) {
			eventQueue.push({
				type: "enter",
				time: time(),
				nodeId: info.nodeId 
			});
		}
		return info;
	}
	
	__tracer.traceExit = function(info) {
		if (traceDepth) {
			eventQueue.push({
				type: "exit",
				time: time(),
				nodeId: info.nodeId
			});
		}
		return info;
	}

	__tracer.traceFunCall = function (info) {
		var customThis = false, fthis, func;

		if ('func' in info) {
			func = info.func;
		} else {
			customThis = true;
			fthis = info.this;
			func = fthis[info.property];
		}
		
		var isDefineProperty = info.this === Object && info.property === "defineProperty";
		if (isDefineProperty) {
			var nodeId = info.nodeId;
			var definePropertyNode = definePropertyNodes[nodeId];
			var getNode = nodes[definePropertyNode.get];
			var setNode = nodes[definePropertyNode.set];
			if (definePropertyNode) {
				return function () {
					var propertyName = arguments[1];
					if (propertyName) {
						if (getNode) {
							getNode.name = "get " + propertyName;
						}
						if (setNode) {
							setNode.name = "set " + propertyName;
						}
					}
					return func.apply(customThis ? fthis : this, arguments);
				};
			}
		}
		return function () {
			return func.apply(customThis ? fthis : this, arguments);
		};
	};

	__tracer.Array = Array;
}

function start() {
	console.log("Instrumentation tracing started");
	traceDepth++;
}
exports.start = start;

function stop() {
	if (traceDepth < 0) {
		console.log("Unbalanced calltree start/stop calls.");
	}
	traceDepth--;
	console.log("Instrumentation tracing stopped");
	if (!traceDepth) {
		print();
	}
}
exports.stop = stop;

function print() {
	var indent = "";
	var stack = [];
	var offset = undefined;
	for (var i = 0; i < eventQueue.length; i++) {
		var trace = eventQueue[i];
		var node = nodes[trace.nodeId];
		
		if (trace.type === "enter") {
			if (!offset) {
				offset = trace.time;
				console.log("CALLTREE: // offset: " + trace.time);
			}
			stack.push(trace);
			console.log("CALLTREE: " + indent + node.name + "() { // " + prettyNodeSource(node));
			indent += "  ";
			console.log("CALLTREE: " + indent + "// start:    " + (trace.time - offset) + "ms");
		}
		
		if (trace.type === "exit") {
			if (stack.length <= 0) {
				console.log("CALLTREE: // } missing start time for: " + node.name + " " + prettyNodeSource(node));
				continue;
			}
			var startTrace = stack.pop();
			if (startTrace.nodeId != trace.nodeId) {
				console.log("CALLTREE: ERROR: Enter/Exit pairs do not match!");
				break;
			}
			console.log("CALLTREE: " + indent  + "// end:      " + (trace.time - offset) + "ms");
			indent = indent.substr(0, indent.length - 2);
			var duration = trace.time - startTrace.time;
			console.log("CALLTREE: " + indent + "} // duration: " + duration + "ms");
		}
	};
	while(stack.pop()) {
		indent = indent.substr(0, indent.length - 2);
		console.log("CALLTREE: " + indent + "} // missing end time");
	}
	eventQueue = [];
	console.log("Reset trace event queue");
}

function prettyNodeSource(node) {
	return node.path + ":" + node.start.line + ":" + node.start.column + "~" + node.end.line + ":" + node.end.column;
}
