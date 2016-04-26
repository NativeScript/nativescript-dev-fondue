
var traceDepth = 0;
var eventQueue = [];
var nodes = {};

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
			data.nodes.forEach(function(node) {
				nodes[node.id] = node;
			});
		}
		return info;
	}
	
	__tracer.traceFileEntry = function(info) {
		return info;
	}
	
	__tracer.traceFileExit = function(info) {
		//console.log("traceFileExit: " + info.nodeId);
		return info;
	}
	
	__tracer.traceEnter = function(info) {
		if (traceDepth) {
			eventQueue.push({
				type: "enter",
				time: new Date().getTime(),
				nodeId: info.nodeId 
			});
		}
		return info;
	}
	
	__tracer.traceExit = function(info) {
		if (traceDepth) {
			eventQueue.push({
				type: "exit",
				time: new Date().getTime(),
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
	for (var i = 0; i < eventQueue.length; i++) {
		var trace = eventQueue[i];
		var node = nodes[trace.nodeId];
		
		if (trace.type === "enter") {
			stack.push(trace);
			console.log("CALLTREE: " + indent + node.name + "() { // " + node.id);
			indent += "  ";
			console.log("CALLTREE: " + indent + "// start: " + trace.time);
		}
		
		if (trace.type === "exit") {
			if (stack.length <= 0) {
				console.log("CALLTREE: // } missing start time for: " + node.name + " " + node.id);
				continue;
			}
			var startTrace = stack.pop();
			if (startTrace.nodeId != trace.nodeId) {
				console.log("CALLTREE: ERROR: Enter/Exit pairs do not match!");
				break;
			}
			console.log("CALLTREE: " + indent  + "// end:   " + trace.time);
			indent = indent.substr(0, indent.length - 2);
			var duration = trace.time - startTrace.time;
			console.log("CALLTREE: " + indent + "} // (" + duration + "ms)");
		}
	};
	while(stack.pop()) {
		indent = indent.substr(0, indent.length - 2);
		console.log("CALLTREE: " + indent + "} // missing end time");
	}
	eventQueue = [];
}


