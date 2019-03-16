/**
 * Created by nopony on 11/02/2017.
 */

var fs = require('fs');

module.exports.init = function () {
    
    var Nodes = (fs.existsSync('./content/.nodestorage.json')) ? JSON.parse(fs.readFileSync('./content/.nodestorage.json').toString()) : null;
    
    if(Nodes == null) {
            // console.log('.nodestorage file failed to load');
            // console.log('You probably need to parse nodes into JSON format first');
            return
        }
    // else console.log('NodesManager Initiated!');
    return {
        allNodes: Nodes,
        /**
         *
         * @param code {string} code of the node to search for
         * @returns {Object}
         */
        getNodeByCode: function (code) {
            var result = null;
            Nodes.forEach(function (node) {
                if(node.nodeCode == code) result = node;
            });
            return result;
        },
        /**
         *
         * @param code {string} code of the parent to get the children of
         * @returns {Array} Array of all DIRECT child nodes
         */
        getDirectChildrenNodesByCode: function (code) {
            var CodeRegexp = new RegExp(code + '...');
            var returnArray = [];
        
            Nodes.forEach(function (node) {
                if(CodeRegexp.test(node.nodeCode)) returnArray.push(node);
            });
            return returnArray
        },
        /**
         *
         * @param code
         * @returns {Array} Array of all nodes connected to the parent, directly or not.
         */
        getIndirectChildrenNodesByCode: function (code) {
            var CodeRegexp = new RegExp(code + '.{3, 12}');
            var returnArray = [];
        
            Nodes.forEach(function (node) {
                if(CodeRegexp.test(node.nodeCode)) returnArray.push(node);
            });
            return returnArray
        },
        /**
         *
         * @param code
         * @returns {string}
         */
        getFullName: function (code) {
            let name = '';
            let i = 3;
            if(!code || !code.length)
                return '';
            if(code.length === 3)
                return this.getNodeByCode(code).title;
            while(i !== code.length){
                i += 3;
                const separator = i % 6 ? ' - ' : ': ';
                const subtitle = this.getNodeByCode(code.slice(0,i)).title;
                if(subtitle)
                    name = name + subtitle + separator;
            }
            return name.slice(0,-2).trim();
        },
        allNodesWithFullName : function () {
            return this.allNodes.map( node => {
                const newNode = JSON.parse(JSON.stringify(node));
                newNode.title = this.getFullName(newNode.nodeCode);
                return newNode;
            });
        }
    }
};