const convertArrayToMatrix = (arr, matrixWidth = 2) => {
	if (!Array.isArray(arr)) {
		return [];
	}

	let tmpArr = [...arr];
	let resultMatrix = [];

	do {
		resultMatrix.push(tmpArr.splice(0, matrixWidth));
	} while (tmpArr.length > 0)

	return resultMatrix;
};

module.exports = {
	convertArrayToMatrix,
};
