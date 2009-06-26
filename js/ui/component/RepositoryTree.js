Ext.namespace('ui','ui.component','ui.component._RepositoryTree');

//------------------------------------------------------------------------------
// RepositoryTree internals

// RepositoryTree root node
ui.component._RepositoryTree.root = new Ext.tree.AsyncTreeNode({
    id        : '/',
    text      : _('Repository'),
    draggable : false // disable root node dragging
});

// RepositoryTree default tree loader
ui.component._RepositoryTree.loader = new Ext.tree.TreeLoader({
    dataUrl    : './php/controller.php',
    baseParams : { task : 'getAllFiles' }
});

//------------------------------------------------------------------------------
// RepositoryTree
ui.component.RepositoryTree = Ext.extend(Ext.tree.TreePanel,
{
    animate         : true,
    enableDD        : false,
    useArrows       : true,
    autoScroll      : true,
    bodyBorder      : false,
    containerScroll : true,

    root   : ui.component._RepositoryTree.root,
    loader : ui.component._RepositoryTree.loader,

    listeners: {
        contextmenu : function(node, e)
        {
            node.select();
            phpDoc.repositoryContextMenu(node).showAt(e.getXY());
        },
        dblclick : function(node, e)
        {
            if (node.attributes.type === 'file') { // files only

                var FilePath  = node.attributes.id,
                    FileID    = Ext.util.md5('AF-' + FilePath),
                    extension = node.attributes.extension,
                    t, FileLang, FileName, parser,
                    panelWest, panelCenter;

                // Render only if this tab don't exist yet
                if (!Ext.getCmp('main-panel').findById('AF-' + FileID)) {

                    // CleanUp the path
                    t = FilePath.split('/');
                    t.shift();
                    t.shift();

                    FileName = t.pop();

                    FileLang = t.shift();
                    FilePath = (t.length > 0) ? '/' + t.join('/') + '/' : '/';

                    if (extension !== 'html' && extension !== 'php') {
                        parser = extension;
                    } else {
                        parser = 'xml';
                    }

                    if (extension === 'gif' || extension === 'png') {

                        panelWest = {};

                        panelCenter = {
                            xtype: 'panel',
                            layout: 'fit',
                            bodyStyle: 'padding:5px 5px 0',
                            html: '<img src="/data/' + this.userLogin +
                                    '/phpdoc-' + this.userLang + FilePath + '" />'
                        };

                    } else {

                        panelWest = {
                            xtype       : 'panel',
                            region      : 'west',
                            title       : 'CvsLog',
                            layout      : 'fit',
                            bodyBorder  : false,
                            split       : true,
                            collapsible : true,
                            collapsed   : true,
                            width       : 375,
                            items       : {
                                xtype       : 'tabpanel',
                                activeTab   : 0,
                                tabPosition : 'bottom',
                                defaults    : { autoScroll: true },
                                items       : [{
                                    title  : 'Log',
                                    layout : 'fit',
                                    items  : [new ui.component.CVSLogGrid({
                                        prefix    : 'AF',
                                        fid       : FileID,
                                        fpath     : FileLang + FilePath,
                                        fname     : FileName,
                                        loadStore : (phpDoc.userConf.conf_allfiles_displaylog === "true")
                                    })]
                                }]
                            }
                        };

                        panelCenter = new ui.component.FilePanel({
                            id           : 'AF' + '-ALL-PANEL-' + FileID,
                            region       : 'center',
                            title        : _('File: ') + FileLang + FilePath + FileName,
                            prefix       : 'AF',
                            ftype        : 'ALL',
                            fid          : FileID,
                            fpath        : FilePath,
                            fname        : FileName,
                            lang         : FileLang,
                            parser       : parser,
                            storeRecord  : node,
                            syncScrollCB : false,
                            syncScroll   : false
                        });
                    }

                    Ext.getCmp('main-panel').add({
                        id          : 'AF-' + FileID,
                        layout      : 'border',
                        title       : FileName,
                        originTitle : FileName,
                        closable    : true,
                        tabTip      : String.format(_('in {0}'), FilePath),
                        iconCls     : 'AllFiles',
                        items       : [panelCenter, panelWest]
                    });

                    Ext.getCmp('main-panel').setActiveTab('AF-' + FileID);

                } else {
                    // This tab already exist. We focus it.
                    Ext.getCmp('main-panel').setActiveTab('AF-' + FileID);
                    // if opening multiple files, dequeue and continue
                    if (phpDoc.filePendingOpen[0]) {
                        log(phpDoc.filePendingOpen.shift());
                        if (phpDoc.filePendingOpen[0]) {
                            if (phpDoc.filePendingOpen[0].fpath) {
                                this.openFile(
                                    phpDoc.filePendingOpen[0].fpath,
                                    phpDoc.filePendingOpen[0].fname
                                );
                            }
                        }
                    }
                }
            }
        }
    },

    initComponent : function()
    {
        ui.component.RepositoryTree.instance = this;
        Ext.apply(this,
        {
            tbar:[
                _('Search: '), ' ',
                new Ext.form.TwinTriggerField({
                    id              : 'AF-search',
                    validationEvent : false,
                    validateOnBlur  : false,
                    trigger1Class   : 'x-form-clear-trigger',
                    trigger2Class   : 'x-form-search-trigger',
                    hideTrigger1    : true,
                    width           : 180,
                    enableKeyEvents : true,
                    listeners : {
                        keypress : function(field, e)
                        {
                            if (e.getKey() == e.ENTER) {
                                this.onTrigger2Click();
                            }
                        }
                    },
                    onTrigger1Click : function()
                    {
                        var instance = ui.component.RepositoryTree.instance;
                        this.setValue('');
                        this.triggers[0].hide();
                        instance.root.setText(_('Repository'));

                        // clear search
                        delete instance.loader.baseParams.search;
                        instance.root.reload();
                    },
                    onTrigger2Click: function()
                    {
                        var instance = ui.component.RepositoryTree.instance,
                            v        = this.getValue();

                        if( v == '' || v.length < 3) {
                            this.markInvalid(_('Your search must contain at least 3 characters'));
                            return;
                        }
                        this.clearInvalid();

                        this.triggers[0].show();

                        // carry search
                        instance.loader.baseParams.search = v;
                        instance.root.reload(function()
                        {
                            instance.root.setText(
                                String.format(
                                    _('Search result: {0}'),
                                    instance.root.childNodes.length
                                )
                            );
                        });

                    }
                })
            ]
        });
        ui.component.RepositoryTree.superclass.initComponent.call(this);

        new Ext.tree.TreeSorter(this, {
            folderSort : true
        });
    },

    openFile : function(fpath, fname)
    {
        Ext.getBody().mask(
            '<img src="themes/img/loading.gif" ' +
                'style="vertical-align: middle;" /> ' +
            _('Please, wait...')
        );
        Ext.getCmp('acc-all-files').expand();

        var t = fpath.split('/'), cb = function(node)
        {
            node.ensureVisible();
            if (t[0] && t[0] !== '') {
                // walk into childs
                for (var i = 0; i < node.childNodes.length; ++i) {
                    if (node.childNodes[i].text === t[0]) {
                        t.shift();
                        node.childNodes[i].expand(false, true, cb.createDelegate(this));
                    }
                }
            } else {
                // leaf node
                for (var i = 0; i < node.childNodes.length; ++i) {
                    if (node.childNodes[i].text === fname) {
                        node.childNodes[i].ensureVisible();
                        node.childNodes[i].ui.highlight();
                        this.fireEvent('dblclick', node.childNodes[i]);
                        Ext.getBody().unmask();
                    }
                }
            }
        }
        this.root.expand(false, true, cb.createDelegate(this));
    }
});
ui.component.RepositoryTree.prototype.instance = null;

