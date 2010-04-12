Ext.namespace('ui','ui.component', 'ui.component._CommitPrompt');

ui.component._CommitPrompt.store = new Ext.data.GroupingStore(
{
    reader : new Ext.data.JsonReader({
        root          : 'Items',
        totalProperty : 'nbItems',
        idProperty    : 'id',
        fields        : [
            {name : 'id'},
            {name : 'path'},
            {name : 'name'},
            {name : 'by'},
            {name : 'date', type : 'date', dateFormat : 'Y-m-d H:i:s'},
            {name : 'type'}
        ]
    }),
    sortInfo : {
        field     : 'name',
        direction : 'ASC'
    },
    groupField : 'path'
});

// PendingCommitGrid columns definition
ui.component._CommitPrompt.columns = [
    new Ext.grid.CheckboxSelectionModel(),
{
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
ui.component._CommitPrompt.view = new Ext.grid.GroupingView({
    forceFit       : true,
    groupTextTpl   : '{[values.rs[0].data["path"]]} ' +
                     '({[values.rs.length]} ' +
                     '{[values.rs.length > 1 ? "' + _('Files') + '" : "' + _('File') + '"]})'
});

ui.component._CommitPrompt.grid = Ext.extend(Ext.grid.GridPanel,
{
    id               : 'commit-grid-panel',
    loadMask         : true,
    autoExpandColumn : 'name',
    height           : 180,
    columns          : ui.component._CommitPrompt.columns,
    view             : ui.component._CommitPrompt.view,
    enableDragDrop   : true,
    sm               : new Ext.grid.CheckboxSelectionModel(),
    listeners: {
        viewready: function(c)
        {
            this.selModel.selectAll();
        }
    },

    initComponent : function()
    {
        Ext.apply(this,
        {
            store : ui.component._CommitPrompt.store
        });
        ui.component._CommitPrompt.grid.superclass.initComponent.call(this);
    }
});

// config - { files: {fid, fpath, fname, fdbid} }
ui.component.CommitPrompt = Ext.extend(Ext.Window,
{
    id         : 'winVCSCommit',
    layout     : 'form',
    title      : _('VCS commit'),
    iconCls    : 'iconPendingCommit',
    closable   : false,
    width      : 600,
    height     : 480,
    resizable  : false,
    modal      : true,
    bodyStyle  : 'padding:5px 5px 0',
    labelAlign : 'top',
    tools      : [{
        id      : 'gear',
        qtip    : _('Configure this tools'),
        handler : function()
        {
            if( ! Ext.getCmp('commit-log-win') )
            {
                new ui.component.CommitLogManager();
            }
            Ext.getCmp('commit-log-win').show(this.id);
        }
    }],
    buttons : [{
        id      : 'win-commit-btn-submit',
        text    : _('Submit'),
        handler : function()
        {
            new ui.task.VCSCommitTask();
        }
    }, {
        id      : 'win-commit-btn-close',
        text    : _('Close'),
        handler : function()
        {
            Ext.getCmp('winVCSCommit').close();
        }
    }],
    initComponent : function()
    {
        var i;

        // We remove all data who are in the store
        ui.component._CommitPrompt.store.removeAll();
        
        for (i = 0; i < this.files.length; ++i) {

            ui.component._CommitPrompt.store.insert(0,
                new ui.component._CommitPrompt.store.recordType({
                    id       : 'need-commit-' + this.files[i].fid,
                    path     : this.files[i].fpath,
                    name     : this.files[i].fname,
                    by       : this.files[i].fby,
                    date     : this.files[i].fdate,
                    type     : this.files[i].ftype,
                    FileDBID : this.files[i].fdbid
                })
            );
        }
        ui.component._CommitPrompt.store.groupBy('path', true); // regroup

        Ext.apply(this,
        {
            items : [new ui.component._CommitPrompt.grid(), {
                xtype         : 'combo',
                name          : 'first2',
                fieldLabel    : _('Older messages'),
                editable      : false,
                anchor        : '100%',
                store         : ui.component._CommitLogManager.store,
                triggerAction : 'all',
                tpl           : '<tpl for="."><div class="x-combo-list-item">{[values.text.split("\n").join("<br/>")]}</div></tpl>',
                valueField    : 'id',
                displayField  : 'text',
                listeners : {
                    select : function(combo, record, numIndex)
                    {
                        Ext.getCmp('form-commit-message-log').setValue(record.data.text);
                    }
                }
            }, {
                xtype      : 'textarea',
                id         : 'form-commit-message-log',
                name       : 'first3',
                fieldLabel : _('Log message'),
                anchor     : '100%',
                height     : 150,
                value      : ''
            }]
        });
        ui.component.CommitPrompt.superclass.initComponent.call(this);
    }
});