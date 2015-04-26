/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, mendix, mxui */

/*
 Formloader
 ========================
 
 @file      : Formloader.js
 @version   : 3.0
 @author    : Mendix
 @date      : 26 Apr 2015
 @copyright : Mendix BV
 @license   : MIT
 
 Documentation
 ========================
 Code base from the original Formloader, ported to mx 5.6 and 5.15
 
 Use this widget to embed forms in other forms and templategrids. When you 
 are copy/pasting forms frequently, this widget might be useful. Furthermore 
 you can achieve conditional visibility and edit functionality inside template 
 grids using this widget. Furthermore this widget can be used to show 
 dataviews outside the content window. 
 */
require(["dojo/_base/declare", "mxui/widget/_WidgetBase", 'dojo/_base/lang', 'dojo/dom-construct', "dojo/dom-geometry",
    "dojo/dom-style", 'dojo/dom-class', "dojo/dom-attr", "dojo/dom", "dojo/_base/fx", "dojo/_base/connect", "dojo/query", "dijit/registry"],
        function (declare, _WidgetBase, lang, domConstruct, domGeo, domStyle, domClass, domAttr, dom, fx, connect, query, registry) {
            'use strict';
            declare("FormLoader.widget.FormLoader", [_WidgetBase], {
                // input args           
                formPath: "",
                wWidth: 0,
                animate: false,
                sharednodeid: "",
                //preempty : true,  //depricaded
                requirescontext: true,
                fixedHeight: 0,
                maxHeight: 0,
                listenchannel: "",
                jumptotop: false,
                cacheforms: false,
                //shared among all.
                loaderStates: {},
                cachedForms: {},
                // local variables
                hasContext: false,
                formObj: null,
                currentNode: null,
                isFormLoading: false,
                hasStarted: false,
                subHandler: null,
                viewSelectorClass: ".mx-dataview", //in Mx4 this is: .mendixFormView

                startup: function () {
                    if (!this.hasStarted) {
                        this.hasStarted = true;
                        domStyle.set(this.domNode, "width", this.wWidth === 0 ? "" : this.wWidth);
                        if (this.listenchannel !== "") {
                            this.subHandler = connect.subscribe((this.getContent() + "/" + this.listenchannel + "/context"), lang.hitch(this, this.receivedContext));
                        }
                        this.updateNode();
                        //if (this.requirescontext) //not needed in from mx 5.9 using widget base
                        //	this.initContext();

                    }
                    this.actLoaded();
                },
                receivedContext: function (obj) {
                    if (this.isFormLoading || domGeo.getMarginBox(this.domNode.parentNode.parentNode).h === 0) {
                        return;
                    }
                    if (obj) {

                        if (this.animate) {
                            var node = this.getTargetNode();
                            domStyle.set(node, "opacity", "0");
                            var anim = fx.animateProperty({
                                node: node,
                                duration: 1175,
                                properties: {
                                    "opacity": 1
                                }
                            }).play();
                        } else {
                            domStyle.set(this.domNode, "display", "")
                        }
                        this.hasContext = true;
                        if (this.formObj && obj != undefined) {
                            this.loadContext(obj);
                        } else if (this.formObj) {
                            /*
                             Ignore this as the loading might take really long and we want to show the new object!
                             Leads to unexpected behavior when combined with the Navigation Loader which marks the active object
                             */
                            //this.isFormLoading = true; 
                            this.loadContext();
                        } else
                            this.openForm(obj);

                        if (this.jumptotop) {
                            var content = query(".dijitContentPane");
                            for (var i = 0; i < content.length; i++) {
                                content[i].scrollTop = 0;
                            }
                            scroll(0, 0);
                        }
                    } else {
                        //Empty... 
                        if (this.formObj) {
                            if (this.animate) {
                                var node = this.getTargetNode();
                                var anim = fx.animateProperty({
                                    node: node,
                                    duration: 1175,
                                    properties: {
                                        "opacity": 0
                                    },
                                    onEnd: lang.hitch(this, function () {
                                        this.formObj.destroy();
                                        this.formObj = null;
                                        domStyle.set(this.domNode, "display", "none");
                                    })
                                }).play();
                            } else {
                                this.formObj.destroy();
                                this.formObj = null;
                                domStyle.set(this.domNode, "display", "none");
                            }
                        }
                    }
                },
                formObjVisible: function () {
                    if (this.formObj) {
                        var pos = domGeo.position(this.formObj.domNode);
                        // This can happen if you have a nested form loader.
                        // These don"t receive the proper uninitialize call which means the formObj is never destroyed.
                        return pos.h > 0;
                    } else {
                        return false;
                    }
                },
                update: function (obj, callback) {
                    if (this.listenchannel === "") {
                        if (obj && obj.getGuid()) {
                            this.hasContext = true;
                        } else {
                            this.hasContext = false;
                            this.mxcontext = null;
                        }
                        if (this.formObj && this.formObjVisible()) {
                            this.receivedContext(obj);
                        } else {
                            this.openForm(obj);
                        }
                    }
                    callback && callback();
                },
                //loads the real content
                openForm: function (obj) {
                    if (this.requirescontext && !this.hasContext) {
                        return; //not ready yet, ignore call
                    }
                    var node = this.getTargetNode();
                    if (this.formPath === "") {
                        domConstruct.empty(node);
                        domStyle.set(node, "display", "none");
                        this.unsetCache();
                    } else {
                        domStyle.set(node, "display", "");
                        if (!this.cacheforms && this.formObj) {
                            try {
                                if (!this.isFormLoading)
                                    this.formObj.destroyRecursive();
                                else {
                                    console.warn("Form is still loading..!");
                                }
                            } catch (e) {
                                console.warn("FormLoader: Destroy form unsuccessful.");
                            }
                        }
                        //state matches the request?
                        if (this.sharednodeid !== "" && this.loaderStates[this.sharednodeid] && this.loaderStates[this.sharednodeid].formPath == this.formPath) {
                            this.formObj = this.loaderStates[this.sharednodeid].formObj;
                            // After 6 times loading the form, it seems to be cleaned up by the client
                            // So we have to rebuild it again...
                            // null check for some cases   //this happens in IE               // this happens in FF
                            if (!this.formObj.domNode || !this.formObj.domNode.innerHTML || !this.formObj.domNode.parentNode)
                                this.loadFormHelper(node);
                            else {
                                this.updateNode();
                                this.loadContext(obj); //we already have the proper form
                            }
                        }
                        //not the active state, but, form is in cache
                        else if (/*this.sharednodeid != "" && */ this.cachedForms[this.formPath] && this.cacheforms) {
                            this.formObj = this.cachedForms[this.formPath];
                            this.loaderStates[this.sharednodeid] = {
                                formPath: this.formPath,
                                context: null, //MWE: TODO, context might be already the proper one?
                                formObj: this.formObj
                            };
                            domConstruct.empty(node);
                            // After 6 times loading the form, it seems to be cleaned up by the client
                            // So we have to rebuild it again...
                            // null check for some cases   //this happens in IE               // this happens in FF
                            if (!this.formObj || !this.formObj.domNode || !this.formObj.domNode.innerHTML || !this.formObj.domNode.parentNode)
                                this.loadFormHelper(node);
                            else {
                                domConstruct.place(this.formObj.domNode.parentNode, node);
                                this.updateNode();
                                this.loadContext(obj);
                            }
                        } else
                            this.loadFormHelper(node, obj);
                    }
                },
                loadFormHelper: function (node, obj) {
                    //cached nowhere, load the form. MWE: somehow, applyContext is triggerd twice often...
                    if (!this.isFormLoading) {
                        this.isFormLoading = true;
                        var contentid = this.id + (+new Date());
                        if (mx.ui.openFormInNode) {
                            window.mx.ui.openFormInNode(this.formPath, node, null, {
                                content_id: contentid
                            },
                            lang.hitch(this, this.loadFormData, obj, node),
                                    function (err) {
                                        console.error("FormLoader widget could not load the form: " + err);
                                    }
                            );
                        } else {
                            mx.ui.openForm(this.formPath, {
                                domNode: node,
                                params: {
                                    content_id: contentid
                                },
                                error: function (err) {
                                    console.error("FormLoader widget could not load the form: " + err);
                                },
                                callback: lang.hitch(this, this.loadFormData, obj, node)
                            });
                        }
                    }
                },
                loadFormData: function (obj, node) {
                    // Tab container has its dijit node deeper then a dataview. This should keep it versatile.
                    var formNode = query(this.viewSelectorClass, node)[0];
                    this.formObj = formNode ? registry.byNode(formNode) : null;
                    //cache the current state & form
                    if (this.cacheforms) {
                        if (this.sharednodeid !== "")
                            this.loaderStates[this.sharednodeid] = {
                                formPath: this.formPath,
                                context: null,
                                formObj: this.formObj
                            };
                        this.cachedForms[this.formPath] = this.formObj;
                    }
                    this.updateNode();
                    this.loadContext(obj);
                },
                findNode: function (node) {
                    return node.childNodes[0];
                },
                loadContext: function (obj) {
                    if (this.requirescontext) {
                        if (this.sharednodeid !== "" && this.loaderStates[this.sharednodeid] && this.loaderStates[this.sharednodeid].context == this.mxcontext.getActiveGUID()) {
                            //console.info("Reusing context");
                            this.isFormLoading = false;
                            return;
                        } else if (obj) {
                            var ctxt = new mendix.lib.MxContext();
                            //ctxt.setTrackObject(this.mxcontext.getTrackObject()); // Breaks in 3.1
                            ctxt.setContext(obj.getEntity(), obj.getGuid());
                            this.formObj.applyContext(ctxt, lang.hitch(this, function () {
                                this.isFormLoading = false;
                                if (this.scrollTop) {
                                    var content = query(".dijitContentPane");
                                    for (var i = 0; i < content.length; i++) {
                                        content[i].scrollTop = 0;
                                    }
                                    scroll(0, 0);
                                }
                            }));
                            if (this.sharednodeid !== "" && this.loaderStates[this.sharednodeid]) { //update cache
                                this.loaderStates[this.sharednodeid].context = obj.getGuid();
                            }
                        } else {
                            var ctxt = new mendix.lib.MxContext();
                            //ctxt.setTrackObject(this.mxcontext.getTrackObject()); // Breaks in 3.1
                            ctxt.setContext(this.mxcontext.getActiveClass(), this.mxcontext.getActiveGUID());
                            this.formObj.applyContext(ctxt, lang.hitch(this, function () {
                                this.isFormLoading = false;
                                if (this.scrollTop) {
                                    var content = query(".dijitContentPane");
                                    for (var i = 0; i < content.length; i++) {
                                        content[i].scrollTop = 0;
                                    }
                                    scroll(0, 0);
                                }
                            }));
                            if (this.sharednodeid !== "" && this.loaderStates[this.sharednodeid]) { //update cache
                                this.loaderStates[this.sharednodeid].context = this.mxcontext.getActiveGUID();
                            }
                        }
                    } else if (this.formObj) {
                        var ctxt2 = new mendix.lib.MxContext();
                        this.formObj.applyContext(ctxt2, lang.hitch(this, function () {
                            this.isFormLoading = false;
                            if (this.scrollTop) {
                                var content = query(".dijitContentPane");
                                for (var i = 0; i < content.length; i++) {
                                    content[i].scrollTop = 0;
                                }
                                scroll(0, 0);
                            }
                        }));
                    }
                },
                //set basic layout which does not depend on the actual form
                updateNode: function () {
                    var node = this.getTargetNode();
                    if (this.animate) {
                        domStyle.set(node, "opacity", 0);
                        var anim = fx.animateProperty({
                            node: node,
                            duration: 1175,
                            properties: {
                                "opacity": 1
                            }
                        }).play();
                    }
                    if (this.formPath === "" || this.fixedHeight !== 0)
                        domStyle.set(node, "height", this.fixedHeight + "px");
                    else
                        domStyle.set(node, "height", "");

                    try {
                        if (node.childNodes.length > 0) //apply new class beforehand
                            domClass.add(node.childNodes[0], domAttr.get(this.domNode, "class"));
                    } catch (e) {
                        //
                    }
                },
                resumed: function () {
                    if (this.sharednodeid !== "") {
                        this.updateNode();

                        if (!this.requirescontext) {
                            this.openForm(null);
                        } else if (this.hasContext && this.mxcontext && this.mxcontext.getActiveGUID()) {
                            mx.processor.get({
                                guid: this.mxcontext.getActiveGUID(),
                                callback: lang.hitch(this, function (obj) {
                                    this.updateNode();
                                    this.openForm(obj);
                                })
                            });
                        }
                    }
                },
                getTargetNode: function () {
                    var n = this.sharednodeid === "" ? this.domNode : dom.byId(this.sharednodeid);
                    if (!n)
                        throw this.id + " no target node found!";
                    return n;
                },
                unsetCache: function () {
                    if (this.sharednodeid !== "" && this.loaderStates[this.sharednodeid])
                        this.loaderStates[this.sharednodeid] = undefined;
                },
                uninitialize: function () {
                    try {
                        this.subHandler && connect.unsubscribe(this.subHandler);
                        this.formObj && this.formObj.destroy();
                        //MWE: remove form or not? Keeping it in Mem might be nice and fast?
                    } catch (e) {
                        console.warn("Error while disposing: " + e);
                    }
                }
            });
        });