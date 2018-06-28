//----------------------------------------------------------------------------------------------------------------------------------------------------------------
class SimulantReconciliator {
    constructor() {};
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
// 0 -> Virtual                                                                                                               //  
// 1 -> Physical                                                                                                              //
SimulantReconciliator.prototype.currentContext = 0;                                                                           //
SimulantReconciliator.prototype.registeredComponents = [];

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.setBooleanProp = function($target, name, value) {                                              // 
    if(value) {                                                                                                                //
        $target.setAttribute(name, value);                                                                                     //
        $target[name] = true;
    } else {
        $target[name] = false;
    } 
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.isEventProp = function(name) {                                                                  //
    return /^on/.test(name);                                                                                                    //
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.extractEventName = function(name) {                                                              //
    return name.slice(2).toLowerCase();                                                                                          //
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.isCustomProp = function(name) {
    return SimulantReconciliator.prototype.isEventProp(name) || name === 'forceUpdate' || name === 'Virtual_ID';
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.setProp = function($target, name, value) {
    if(SimulantReconciliator.prototype.isCustomProp(name)) {
        return;
    } else if (name === 'className') {
        $target.setAttribute('class', value);
    } else if (typeof value === 'boolean') {
        SimulantReconciliator.prototype.setBooleanProp($target, name, value);
    } else {
        if($target === undefined) return;
        $target.setAttribute(name, value);
    }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.removeProp = function($target, name, value) {
    if (SimulantReconciliator.prototype.isCustomProp(name)) {
        return;
      } else if (name === 'className') {
        $target.removeAttribute('class');
      } else if (typeof value === 'boolean') {
        SimulantReconciliator.prototype.removeBooleanProp($target, name);
      } else {
        $target.removeAttribute(name);
      }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.setProps = function($target, props) {
    Object.keys(props).forEach(name => {
        SimulantReconciliator.prototype.setProp($target, name, props[name]);
    });
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.removeBooleanProp = function($target, name) {
    $target.removeAttribute(name);
    $target[name] = false;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.updateProp = function($target, name, newVal, oldVal) {
    if (!newVal) {
        SimulantReconciliator.prototype.removeProp($target, name, oldVal);
    } else if (!oldVal || newVal !== oldVal) {
        SimulantReconciliator.prototype.setProp($target, name, newVal);
    }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.addEventListeners = function($target, props) {
    Object.keys(props).forEach(name => {
        if (SimulantReconciliator.prototype.isEventProp(name)) {
            $target.addEventListener(
                SimulantReconciliator.prototype.extractEventName(name),
                props[name]
            );
        }
    });
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.updateProps = function($target, newProps, oldProps = {}) {
    const props = Object.assign({}, newProps, oldProps);
    Object.keys(props).forEach(name => {
        SimulantReconciliator.prototype.updateProp($target, name, newProps[name], oldProps[name]);
    });
};


//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.createDOMElement = function(node) {
    if(node.render !== undefined) {
        node = node.render();
    }
    if (typeof node === 'string') {
        return document.createTextNode(node);
    }
    if(node == undefined) {
        return document.createTextNode('');
    }
    const $el = document.createElement(node.type);
    SimulantReconciliator.prototype.setProps($el, node.props);
    SimulantReconciliator.prototype.addEventListeners($el, node.props);
    node.children
        .map(SimulantReconciliator.prototype.createDOMElement)
        .forEach($el.appendChild.bind($el));
    return $el;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.changed = function(node1, node2) {
    return typeof node1 !== typeof node2 ||
            typeof node1 === 'string' && node1 !== node2 ||
            node1.type !== node2.type ||
            node1.props && node1.props.forceUpdate;
}; 

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.updateElement = function($parent, newNode, oldNode, index = 0) {
    if(newNode.render !== undefined && oldNode) {
        if(this.currentContext === 0) {
            SimulantReconciliator.prototype.registeredComponents.push({ 
                comp   : newNode, 
                parent : $parent, 
                marker : 0 
            });
        }
        newNode = newNode.render();
    }
    if (!oldNode) {
        if(this.currentContext === 0) {
            newNode = SimulantReconciliator.prototype.processNode($parent, newNode);
            $parent.children.push(newNode);
        }else{
            $parent.appendChild(
                SimulantReconciliator.prototype.createDOMElement(newNode)
            );
        }
    } else if (!newNode) {
        if(this.currentContext === 0) {
            delete $parent.children[index];
        }else{
            $parent.removeChild(
                $parent.childNodes[index]
            );
        }
    } else if (SimulantReconciliator.prototype.changed(newNode, oldNode)) {
        if(this.currentContext === 0) {
            newNode = SimulantReconciliator.prototype.processNode($parent, newNode);
            $parent.children[index] = newNode;
        }else{
            $parent.replaceChild(
                SimulantReconciliator.prototype.createDOMElement(newNode),
                $parent.childNodes[index]
            );
        }
    } else if (newNode.type) {
        if(this.currentContext === 1) {
            SimulantReconciliator.prototype.updateProps(
                $parent.childNodes[index],
                newNode.props,
                oldNode.props
            );
        }else{
            $parent.props = newNode.props;
        }
        const newLength = newNode.children.length;
        const oldLength = oldNode.children.length;
        for (let i = 0; i < newLength || i < oldLength; i++) {
            if(this.currentContext === 0) {
                SimulantReconciliator.prototype.updateElement(
                    $parent.children[index],
                    newNode.children[i],
                    oldNode.children[i],
                    i
                );
            }else{
                SimulantReconciliator.prototype.updateElement(
                    $parent.childNodes[index],
                    newNode.children[i],
                    oldNode.children[i],
                    i
                );
            }
        }
    }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.setContext = function(newContext) {
    SimulantReconciliator.prototype.currentContext = newContext;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.processedNode = null;

SimulantReconciliator.prototype.processNode = function($parent, node) {
    SimulantReconciliator.prototype.processNodeFunc($parent, node);
    return SimulantReconciliator.prototype.processedNode;
}

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantReconciliator.prototype.processNodeFunc = function($parent, node) {
    if(node.children !== undefined) {
        for(let i = 0; i < node.children.length; i++) {
            if(node.children[i].render !== undefined) {
                SimulantReconciliator.prototype.registeredComponents.push({ 
                    comp   : node.children[i], 
                    parent : node, 
                    marker : 1 
                });
                node.children[i] = node.children[i].render();
            }
            SimulantReconciliator.prototype.processNodeFunc(node, node.children[i]);
        }
    };
    SimulantReconciliator.prototype.processedNode = node;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
class SimulantDOM {
    constructor() {};
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.createElement = function(type, props, ...children) {
    for(let i = 0; i < children.length; i++) {
        if(children[i] === false) children[i] = '';
    };
    if(typeof type === 'function') {
        if(children.length > 0) props ? props.children = children : props = { children : children };
        const instance = new type(props);
        if(instance.render !== undefined) {
            return instance;
        }else{
            return type(props);
        }
    }
    let temp = [];
    for(let i = 0; i < children.length; i++) {
        if(children[i] instanceof Array) {
            for(let j = 0; j < children[i].length; j++) {
                temp.push(children[i][j]);
            }
        }else{
            temp.push(children[i]) 
        }        
    }
    children = temp;
    return {
        type, props: props || {}, children
    }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.SimulantReconciliator = new SimulantReconciliator();

SimulantDOM.prototype.SDOM = undefined;
SimulantDOM.prototype.SDOM_TARGET = undefined;

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.createDOM = function($target, element) {
    SimulantDOM.prototype.SDOM_TARGET = $target;    
    SimulantDOM.prototype.SDOM = <div style="width: 100%; height: 100%;"></div>;
    SimulantDOM.prototype.updateElement(element);
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.updateElement = function(newNode, oldNode, depth) {
    if(depth !== undefined) {
            SimulantDOM.prototype.cleanRegisteredComponents(depth);
    }
    SimulantDOM.prototype.SimulantReconciliator.setContext(0);    
    SimulantDOM.prototype.SimulantReconciliator.updateElement(
        SimulantDOM.prototype.determineDepth(depth), newNode, oldNode
    );
    SimulantDOM.prototype.processComponents(SimulantDOM.prototype.SDOM);
    SimulantDOM.prototype.SimulantReconciliator.setContext(1);
    SimulantDOM.prototype.SimulantReconciliator.updateElement(
        SimulantDOM.prototype.getTarget(depth), newNode, oldNode
    );
    SimulantDOM.prototype.SimulantReconciliator.setContext(0);     
    SimulantDOM.prototype.registerAllComponents(SimulantDOM.prototype.determineDepth(depth));
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.processComponents = function(element, depth = '0') {
    if(element === undefined || element.props === undefined) return;    
    element.props.Virtual_ID = depth;
    if(element.children === undefined) return;
    for(let i = 0; i < element.children.length; i++) {
        let new_depth = depth + '_' + i;
        SimulantDOM.prototype.processComponents(element.children[i], new_depth);
    };
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.registerAllComponents = function(element) {
    if(element !== undefined && element.children !== undefined) {
        for(let i = 0; i < SimulantReconciliator.prototype.registeredComponents.length; i++) {
            if(element.props.Virtual_ID === SimulantReconciliator.prototype.registeredComponents[i].parent.props.Virtual_ID) {
                if(SimulantReconciliator.prototype.registeredComponents[i].comp.props === null || undefined) {
                    SimulantReconciliator.prototype.registeredComponents[i].comp.props = {};
                }
                SimulantReconciliator.prototype.registeredComponents[i].comp.props.target = (
                    SimulantDOM.prototype.getTarget(element.props.Virtual_ID)
                );
                SimulantReconciliator.prototype.registeredComponents[i].comp.props.parent_Virtual_ID = element.props.Virtual_ID;
                if(!SimulantReconciliator.prototype.registeredComponents[i].comp.hasBeenRegistered) {
                    SimulantReconciliator.prototype.registeredComponents[i].comp.uponRegistrationFunc();
                    SimulantReconciliator.prototype.registeredComponents[i].comp.hasBeenRegistered = true;
                }
            }
        }
        for(let i = 0; i < element.children.length; i++) {
            SimulantDOM.prototype.registerAllComponents(element.children[i]);
        }
    }
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.getTarget = function(inputString) {
    if(inputString === undefined) return SimulantDOM.prototype.SDOM_TARGET;    
    let depthID_String = `${inputString}`;
    depthID_String = depthID_String.replace(/_/g, ',');
    let depthID_Array = JSON.parse('[' + depthID_String + ']');
    let DOM_target = SimulantDOM.prototype.SDOM_TARGET;
    for(let i = 1; i < depthID_Array.length; i++) {
        DOM_target = DOM_target.childNodes[depthID_Array[i]];
    };
    return DOM_target;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.determineDepth = function(Virtual_ID) {
    if(Virtual_ID === undefined) return SimulantDOM.prototype.SDOM;
    let depthID_String = `${Virtual_ID}`;
    depthID_String = depthID_String.replace(/_/g, ',');
    let depthID_Array = JSON.parse('[' + depthID_String + ']');
    let SDOM_target = SimulantDOM.prototype.SDOM;
    for(let i = 1; i < depthID_Array.length; i++) {
        SDOM_target = SDOM_target.children[depthID_Array[i]];
    };
    return SDOM_target;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.cleanRegisteredComponents = function(SDOM_branch) {
    SDOM_branch = `${SDOM_branch}_0`; 
    let temp = [];
    for(let i = 0; i < SimulantReconciliator.prototype.registeredComponents.length; i++) {
        let validScope = SimulantReconciliator.prototype.registeredComponents[i].parent.props.Virtual_ID;
        validScope = `${validScope}`;
        validScope = validScope.substring(0, SDOM_branch.length);
        if(SDOM_branch !== validScope) {
            temp.push(SimulantReconciliator.prototype.registeredComponents[i]);
        }
    }
    SimulantReconciliator.prototype.registeredComponents = temp;
};

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
SimulantDOM.prototype.removeArrayElementByIndex = function(array, index) {
    let temp = [];
    for(let i = 0; i < array.length; i++) {
        if(i !== index) {
            temp.push(array[i]);
        }
    };
    return temp;
};

SimulantDOM.prototype.Component = class {
    constructor(props = {}) {
        this.props = props || {};
        this.states = {};
        this.hasBeenRegistered = false;
    };

    setState(newState = {}) {
        const preView = this.render();
        for(let key in newState) this.states[key] = newState[key];
        const postView = this.render();   
        const preScene = this.preSceneMount();
        const postScene = this.postSceneMount();
        preScene.callback();
        setTimeout(() => {
            SimulantDOM.prototype.updateElement(postView, preView, this.props.parent_Virtual_ID);
            if(postScene['callback'] != undefined) postScene.callback();
        }, preScene['forwardDelay'] != undefined ? preScene.forwardDelay : 0);
    };

    forceUpdate() {
        const preView = this.render();
        const postView = this.render();   
        const preScene = this.preSceneMount();
        const postScene = this.postSceneMount();
        preScene.callback();
        setTimeout(() => {
            SimulantDOM.prototype.updateElement(postView, preView, this.props.parent_Virtual_ID);
            if(postScene['callback'] != undefined) postScene.callback();
        }, preScene['forwardDelay'] != undefined ? preScene.forwardDelay : 0);
    };

    uponRegistrationFunc() {};

    preSceneMount(validParams = {
        callback     : () => {},
        forwardDelay : 0,
    }) {
        return validParams;
    };
    
    postSceneMount(validParams = {
        callback : () => {},
    }) {
        return validParams;
    };

    render() {};
};

export const Simulant = new SimulantDOM();
