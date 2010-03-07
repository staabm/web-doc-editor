Ext.namespace('ui','ui.component','ui.component._PendingCommitGrid');

//------------------------------------------------------------------------------
// PendingCommitGrid internals

// PendingCommitGrid store
ui.component._PendingCommitGrid.store = Ext.extend(Ext.data.GroupingStore,
{
    reader : new Ext.data.JsonReader(
        {
            root          : 'Items',
            totalProperty : 'nbItems',
            id            : 'id'
        }, Ext.data.Record.create([
            {
                name    : 'id',
                mapping : 'id'
            }, {
                name    : 'path',
                mapping : 'path'
            }, {
                name    : 'name',
                mapping : 'name'
            }, {
                name    : 'by',
                mapping : 'by'
            }, {
                name       : 'date',
                mapping    : 'date',
                type       : 'date',
                dateFormat : 'Y-m-d H:i:s'
            }, {
                name    : 'type',
                mapping : 'type'
            }
        ])
    ),
    sortInfo : {
        field     : 'name',
        direction : "ASC"
    },
    groupField : 'path',
    listeners : {
        add : function(ds)
        {
            Ext.getDom('acc-pendingCommit-nb').innerHTML = ds.getCount();
        },
        datachanged : function(ds)
        {
            Ext.getDom('acc-pendingCommit-nb').innerHTML = ds.getCount();
        }
    }
});

// PendingCommitGrid columns definition
ui.component._PendingCommitGrid.columns = [{
    id        : 'name',
    header    : _('Files'),
    sortable  : true,
    dataIndex : 'name'
}, {
    header    : _('Modified by'),
    width     : 45,
    sortable  : true,
    dataIndex : 'by'
}, {
    header    : _('Date'),
    width     : 45,
    sortable  : true,
    dataIndex : 'date',
    renderer  : Ext.util.Format.dateRenderer(_('Y-m-d, H:i'))
}, {
    header    : _('Path'),
    dataIndex : 'path',
    hidden    : true
}];

// PendingCommitGrid view
ui.component._PendingCommitGrid.view = new Ext.grid.GroupingView({
    forceFit       : true,
    groupTextTpl   : '{[values.rs[0].data["path"]]} ' +
                     '({[values.rs.length]} ' +
                     '{[values.rs.length > 1 ? "' + _('Files') + '" : "' + _('File') + '"]})',
    emptyText      : '<div style="text-align: center;">' + _('No pending for Commit') + '</div>',
    deferEmptyText : false,
    getRowClass  : function(record, numIndex, rowParams, store)
    {
        if ( record.data.type === 'update' ) {
            return 'file-needcommit-update';
        }
        if ( record.data.type === 'delete' ) {
            return 'file-needcommit-delete';
        }
        if ( record.data.type === 'new' ) {
            return 'file-needcommit-new';
        }
    }
});

Ext.namespace('ui.component._PendingCommitGrid.menu');
// PendingCommitGrid common sub-menu
// config - { rowIdx }
ui.component._PendingCommitGrid.menu.common = function(config)
{
    Ext.apply(this, config);
    this.init();
    ui.component._PendingCommitGrid.menu.common.superclass.constructor.call(this);
};
Ext.extend(ui.component._PendingCommitGrid.menu.common, Ext.menu.Item,
{
    init : function()
    {
        Ext.apply(this,
        {
            text     : _('Commit...'),
            iconCls  : 'iconCommitFileVcs',
            disabled : (PhDOE.userLogin === 'anonymous'),
            handler  : function() { return false; },
            menu     : new Ext.menu.Menu({
                items : [{
                    scope   : this,
                    text    : _('...this file'),
                    iconCls : 'iconCommitFileVcs',
                    handler : function()
                    {
                        var record = ui.component.PendingCommitGrid.getInstance().store.getAt(this.rowIdx),
                            fdbid  = record.data.id,
                            fpath  = record.data.path,
                            fname  = record.data.name,
                            fid    = Ext.util.md5(fpath + fname),
                            tmp;

                        tmp = new ui.component.CommitPrompt({
                            files : [{
                                fid : fid,
                                fpath : fpath,
                                fname : fname,
                                fdbid : fdbid
                            }]
                        }).show();
                    }
                }, {
                    scope   : this,
                    text    : _('...all files modified by me'),
                    iconCls : 'iconCommitFileVcs',
                    handler : function()
                    {
                        var files = [],
                            grid  = ui.component.PendingCommitGrid.getInstance(),
                            tmp;

                        grid.store.each(function(record)
                        {
                            if (record.data.by === PhDOE.userLogin) {
                                var fdbid  = record.data.id,
                                    fpath  = record.data.path,
                                    fname  = record.data.name,
                                    fid    = Ext.util.md5(fpath + fname);
                                files.push({
                                    fid   : fid,
                                    fpath : fpath,
                                    fname : fname,
                                    fdbid : fdbid
                                });
                            }
                        });

                        tmp = new ui.component.CommitPrompt({
                            files : files
                        }).show();
                    }
                }, {
                    scope   : this,
                    text    : _('...all files modified'),
                    iconCls : 'iconCommitFileVcs',
                    handler : function()
                    {
                        var files = [],
                            grid  = ui.component.PendingCommitGrid.getInstance(),
                            tmp;

                        grid.store.each(function(record)
                        {
                            var fdbid  = record.data.id,
                                fpath  = record.data.path,
                                fname  = record.data.name,
                                fid    = Ext.util.md5(fpath + fname);
                            files.push({
                                fid   : fid,
                                fpath : fpath,
                                fname : fname,
                                fdbid : fdbid
                            });
                        });

                        tmp = new ui.component.CommitPrompt({
                            files : files
                        }).show();
                    }
                }]
            })
        });
    }
});

// PendingCommitGrid menu for pending update file
// config - { fpath, fname, rowIdx, grid, event }
ui.component._PendingCommitGrid.menu.update = function(config)
{
    Ext.apply(this, config);
    this.init();
    ui.component._PendingCommitGrid.menu.update.superclass.constructor.call(this);
};
Ext.extend(ui.component._PendingCommitGrid.menu.update, Ext.menu.Menu,
{
    init : function()
    {
        Ext.apply(this,
        {
            items: [
                {
                    scope   : this,
                    text    : '<b>'+_('Edit in a new Tab')+'</b>',
                    iconCls : 'iconPendingCommit',
                    handler : function()
                    {
                        this.grid.openFile(this.grid.store.getAt(this.rowIdx).data.id);
                    }
                }, '-', {
                    scope   : this,
                    text    : _('View Diff'),
                    iconCls : 'iconViewDiff',
                    handler : function()
                    {

                        // Render only if this tab don't exist yet
                        if (!Ext.getCmp('main-panel').findById('diff_panel_pending_' + this.rowIdx)) {

                            // Add tab for the diff
                            Ext.getCmp('main-panel').add({
                                xtype      : 'panel',
                                id         : 'diff_panel_pending_' + this.rowIdx,
                                iconCls    : 'iconTabLink',
                                title      : _('Diff'),
                                tabTip     : String.format(_('Diff for file: {0}'), this.fpath+this.fname),
                                closable   : true,
                                autoScroll : true,
                                html       : '<div id="diff_content_pending_' + this.rowIdx + '" class="diff-content"></div>'
                            });

                            // We need to activate HERE this tab, otherwise, we can mask it (el() is not defined)
                            Ext.getCmp('main-panel').setActiveTab('diff_panel_pending_' + this.rowIdx);

                            Ext.get('diff_panel_pending_' + this.rowIdx).mask(
                                '<img src="themes/img/loading.gif" style="vertical-align: middle;" /> ' +
                                _('Please, wait...')
                            );

                            // Load diff data
                            XHR({
                                scope   : this,
                                params  : {
                                    task     : 'getDiff',
                                    DiffType : 'file',
                                    FilePath : this.fpath,
                                    FileName : this.fname
                                },
                                success : function(response)
                                {
                                    var o = Ext.util.JSON.decode(response.responseText);

                                    // We display in diff div
                                    Ext.get('diff_content_pending_' + this.rowIdx).dom.innerHTML = o.content;
                                    Ext.get('diff_panel_pending_' + this.rowIdx).unmask();
                                }
                            });
                        } else {
                            Ext.getCmp('main-panel').setActiveTab('diff_panel_pending_' + this.rowIdx);
                        }
                    }
                }, {
                    scope   : this,
                    text    : _('Download the diff as a patch'),
                    iconCls : 'iconDownloadDiff',
                    handler : function()
                    {
                        window.location.href = './do/downloadPatch' +
                                               '?FilePath=' + this.fpath +
                                               '&FileName=' + this.fname;
                    }
                }, '-', {
                    scope    : this,
                    text     : _('Clear this change'),
                    iconCls  : 'iconPageDelete',
                    disabled : (PhDOE.userLogin === 'anonymous'),
                    handler  : function()
                    {
                        var tmp = new ui.task.ClearLocalChangeTask({
                            storeRecord : this.grid.store.getAt(this.rowIdx),
                            ftype       : 'update',
                            fpath       : this.fpath,
                            fname       : this.fname
                        });
                    }
                }, '-', new ui.component._PendingCommitGrid.menu.common({
                    rowIdx : this.rowIdx
                })
            ]
        });
    }
});

// PendingCommitGrid menu for pending delete file
// config - { rowIdx, grid, event }
ui.component._PendingCommitGrid.menu.del = function(config)
{
    Ext.apply(this, config);
    this.init();
    ui.component._PendingCommitGrid.menu.del.superclass.constructor.call(this);
};
Ext.extend(ui.component._PendingCommitGrid.menu.del, Ext.menu.Menu,
{
    init : function()
    {
        Ext.apply(this,
        {
            items: [
                {
                    scope   : this,
                    text    : '<b>'+_('View in a new Tab')+'</b>',
                    iconCls : 'iconPendingCommit',
                    handler : function()
                    {
                        this.grid.openFile(this.grid.store.getAt(this.rowIdx).data.id);
                    }
                }, {
                    scope    : this,
                    text     : _('Cancel this deletion'),
                    iconCls  : 'iconPageDelete',
                    disabled : (PhDOE.userLogin === 'anonymous'),
                    handler : function()
                    {

                       var storeRecord = this.grid.store.getAt(this.rowIdx),
                           FilePath    = storeRecord.data.path,
                           FileName    = storeRecord.data.name

                       tmp = new ui.task.ClearLocalChangeTask({
                           storeRecord : storeRecord,
                           ftype       : 'delete',
                           fpath       : FilePath,
                           fname       : FileName
                       });

                    }
                }, '-', new ui.component._PendingCommitGrid.menu.common({
                    rowIdx : this.rowIdx
                })
            ]
        });
    }
});


// PendingCommitGrid menu for pending new file
// config - { rowIdx, grid, event }
ui.component._PendingCommitGrid.menu.newFile = function(config)
{
    Ext.apply(this, config);
    this.init();
    ui.component._PendingCommitGrid.menu.newFile.superclass.constructor.call(this);
};
Ext.extend(ui.component._PendingCommitGrid.menu.newFile, Ext.menu.Menu,
{
    init : function()
    {
        Ext.apply(this,
        {
            items: [
                {
                    scope   : this,
                    text    : '<b>'+_('Edit in a new Tab')+'</b>',
                    iconCls : 'iconPendingCommit',
                    handler : function()
                    {
                        this.grid.openFile(this.grid.store.getAt(this.rowIdx).data.id);
                    }
                }, '-',{
                    scope    : this,
                    text     : _('Clear this change'),
                    iconCls  : 'iconPageDelete',
                    disabled : (PhDOE.userLogin === 'anonymous'),
                    handler  : function()
                    {
                       var storeRecord = this.grid.store.getAt(this.rowIdx),
                           FilePath    = storeRecord.data.path,
                           FileName    = storeRecord.data.name,
                           tmp = new ui.task.ClearLocalChangeTask({
                            storeRecord : storeRecord,
                            ftype       : 'new',
                            fpath       : FilePath,
                            fname       : FileName
                        });
                    }
                }, '-',new ui.component._PendingCommitGrid.menu.common({
                    rowIdx : this.rowIdx
                })]
        });
    }
});

//------------------------------------------------------------------------------
// PendingCommitGrid
ui.component.PendingCommitGrid = Ext.extend(Ext.grid.GridPanel,
{
    loadMask         : true,
    border           : false,
    autoExpandColumn : 'name',
    columns          : ui.component._PendingCommitGrid.columns,
    view             : ui.component._PendingCommitGrid.view,
    enableDragDrop   : true,
    ddGroup          : 'mainPanelDDGroup',

    onRowContextMenu : function(grid, rowIndex, e)
    {
        e.stopEvent();
    
        var storeRecord = grid.store.getAt(rowIndex),
            FileType    = storeRecord.data.type,
            FilePath    = storeRecord.data.path,
            FileName    = storeRecord.data.name,
            tmp;

        grid.getSelectionModel().selectRow(rowIndex);

        if (FileType === 'new') {
            tmp = new ui.component._PendingCommitGrid.menu.newFile({
                grid   : grid,
                rowIdx : rowIndex,
                event  : e
            }).showAt(e.getXY());
        }

        if (FileType === 'delete') {
            tmp = new ui.component._PendingCommitGrid.menu.del({
                grid   : grid,
                rowIdx : rowIndex,
                event  : e
            }).showAt(e.getXY());
        }

        if (FileType === 'update') {
            tmp = new ui.component._PendingCommitGrid.menu.update({
                fpath  : FilePath,
                fname  : FileName,
                grid   : grid,
                rowIdx : rowIndex,
                event  : e
            }).showAt(e.getXY());
        }
    },

    onRowDblClick: function(grid, rowIndex, e)
    {
        this.openFile(this.store.getAt(rowIndex).data.id);
    },

    openFile: function(rowId)
    {
        var storeRecord = false;

        this.store.each(function(r)
        {
            if (r.data.id === rowId) {
                storeRecord = r;
            }
        });

        var FileType    = storeRecord.data.type,
            FilePath    = storeRecord.data.path,
            FileName    = storeRecord.data.name,
            FileLang, tmp, found;

        if (FileType === 'new') {

            tmp = FilePath.split('/');
            FileLang = tmp[0];
            tmp.shift();

            FilePath = "/" + tmp.join('/');

            // Find the id of this row into PendingTranslateGrid.store and open it !
            ui.component.PendingTranslateGrid.getInstance().store.each(function(row) {

                if( (row.data['path']) === FilePath && row.data['name'] === FileName ) {
                    ui.component.PendingTranslateGrid.getInstance().openFile(row.data.id);
                    return;
                }
            });
        }

        if (FileType === 'update') {

            tmp = FilePath.split('/');
            FileLang = tmp[0];
            tmp.shift();

            FilePath = "/" + tmp.join('/');

            // For EN file, we open this new file into the "All files" module
            if( FileLang === 'en' ) {
                ui.component.RepositoryTree.getInstance().openFile('byPath', FileLang+FilePath, FileName);
            } else {

                found = false;

                // Find the id of this row into StaleFileGrid.store and open it !
                ui.component.StaleFileGrid.getInstance().store.each(function(row) {

                    if( (row.data['path']) === FilePath && row.data['name'] === FileName ) {
                        ui.component.StaleFileGrid.getInstance().openFile(row.data.id);
                        found = true;
                        return;
                    }
                });

                // If we haven't found this file in StaleFileGrid, we try into File in error grid.
                if( !found ) {

                    // Find the id of this row into ErrorFileGrid.store and open it !
                    ui.component.ErrorFileGrid.getInstance().store.each(function(row) {

                        if( (row.data['path']) === FilePath && row.data['name'] === FileName ) {
                            ui.component.ErrorFileGrid.getInstance().openFile(row.data.id);
                            found = true;
                            return;
                        }
                    });
                }

                // If we haven't found this file in File in error grid, we search in Pending Reviewed grid.
                if( !found ) {

                    // Find the id of this row into PendingReviewGrid.store and open it !
                    ui.component.PendingReviewGrid.getInstance().store.each(function(row) {

                        if( (row.data['path']) === FilePath && row.data['name'] === FileName ) {
                            ui.component.PendingReviewGrid.getInstance().openFile(row.data.id);
                            found = true;
                            return;
                        }
                    });
                }

                // FallBack : We open it into "All files" modules
                if( !found ) {
                    ui.component.RepositoryTree.getInstance().openFile('byPath', FileLang+FilePath, FileName);
                }

            }
        }

        if (FileType === 'delete') {
            
            tmp = FilePath.split('/');
            FileLang = tmp[0];
            tmp.shift();

            FilePath = "/" + tmp.join('/');

            // Find the id of this row into NotInENGrid.store and open it !
            ui.component.NotInENGrid.getInstance().store.each(function(row) {

                if( (row.data['path']) === FilePath && row.data['name'] === FileName ) {
                    ui.component.NotInENGrid.getInstance().openFile(row.data.id);
                    return;
                }
            });

        }
    },

    initComponent : function()
    {
        Ext.apply(this,
        {
            store : new ui.component._PendingCommitGrid.store({
                proxy : new Ext.data.HttpProxy({
                    url : './do/getFilesPendingCommit'
                })
            })
        });
        ui.component.PendingCommitGrid.superclass.initComponent.call(this);

        this.on('rowcontextmenu', this.onRowContextMenu, this);
        this.on('rowdblclick',    this.onRowDblClick,  this);
    },

    addRecord : function(fid, fpath, fname, type)
    {
        var exist = false;

        this.store.each(function(r)
        {
            if (r.data.path === fpath && r.data.name === fname) {
                exist = true;
            }
        });

        if (!exist) {
            // if not exist, add to store
            this.store.insert(0,
                new this.store.recordType({
                    id   : fid,
                    path : fpath,
                    name : fname,
                    by   : PhDOE.userLogin,
                    date : new Date(),
                    type : type
                })
            );
            this.store.groupBy('path', true); // regroup
        }
    }
});

// singleton
ui.component._PendingCommitGrid.instance = null;
ui.component.PendingCommitGrid.getInstance = function(config)
{
    if (!ui.component._PendingCommitGrid.instance) {
        if (!config) {
           config = {};
        }
        ui.component._PendingCommitGrid.instance = new ui.component.PendingCommitGrid(config);
    }
    return ui.component._PendingCommitGrid.instance;
};
