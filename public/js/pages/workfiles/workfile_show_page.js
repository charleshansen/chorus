;
(function($, ns) {
    var breadcrumbsView = ns.views.ModelBoundBreadcrumbsView.extend({
        getLoadedCrumbs : function() {
            return [
                {label: t("breadcrumbs.home"), url: "#/"},
                {label: t("breadcrumbs.workspaces"), url: '#/workspaces'},
                {label: this.options.workspace.displayShortName(20), url: this.options.workspace.showUrl()},
                {label: t("breadcrumbs.workfiles.all"), url: this.options.workspace.showUrl() + "/workfiles"},
                {label: this.model.get("fileName") }
            ];
        }
    });

    ns.pages.WorkfileShowPage = ns.pages.Base.extend({
        events : function() {
            var superClassEvents = this._super("events");
            return _.extend({}, superClassEvents, {
                "keydown" : "handleShortcut"
            });
        },

        handleShortcut: function() {
        },

        setup : function(workspaceId, workfileId, versionNum) {
            this.model = new ns.models.Workfile({id: workfileId, workspaceId: workspaceId});
            if (versionNum) {
                this.model.set({ versionNum : versionNum }, { silent : true })
            }

            this.model.fetch();
            this.model.workspace().fetch(); 
            this.requiredResources.push(this.model);
            this.requiredResources.push(this.model.workspace());
        },

        resourcesLoaded : function() {
            this.breadcrumbs = new breadcrumbsView({workspace: this.model.workspace(), model: this.model});
            this.sidebar = new chorus.views.WorkfileShowSidebar({model : this.model});
            this.sidebar.bindOnce("sidebar:loaded", _.bind(this.bindSidebar, this));

            this.subNav = new ns.views.SubNav({workspace: this.model.workspace(), tab: "workfiles"});

            this.mainContent = new ns.views.MainContentView({
                model : this.model,
                contentHeader : new ns.views.WorkfileHeader({model : this.model})
            });
            this.bindings.add(this.model, "change", this.modelChanged);
            this.modelChanged();
        },

        modelChanged : function() {
            if (this.model.isLatestVersion() && this.model.get("hasDraft") && !this.model.isDraft) {
                var alert = new chorus.alerts.WorkfileDraft({model : this.model});
                alert.launchModal();
            }
            if (!this.mainContent.contentDetails) {
                this.mainContent.contentDetails = ns.views.WorkfileContentDetails.buildFor(this.model);
                this.mainContent.content = ns.views.WorkfileContent.buildFor(this.model);
                this.mainContent.content.forwardEvent("autosaved", this.mainContent.contentDetails);
                this.mainContent.content.bind("autosaved", function() {
                    this.model.trigger("invalidated");
                }, this);
                this.mainContent.contentDetails.forwardEvent("file:saveCurrent", this.mainContent.content);
                this.mainContent.contentDetails.forwardEvent("file:createWorkfileNewVersion", this.mainContent.content);
                this.mainContent.contentDetails.forwardEvent("file:runCurrent", this.mainContent.content);
                this.mainContent.contentDetails.forwardEvent("file:runInSchema", this.mainContent.content);
            }

            this.render();
        },

        bindSidebar : function() {
            if (this.model && this.model.isSql()) {
                this.sidebar.functionList.forwardEvent("file:insertText", this.mainContent.content)
                this.sidebar.datasetList.forwardEvent("file:insertText", this.mainContent.content)
                this.sidebar.columnList.forwardEvent("file:insertText", this.mainContent.content)
            }
        }
    });

    ns.views.WorkfileHeader = ns.views.Base.extend({
        className : "workfile_header",
        additionalContext : function() {
            return {
                iconUrl : this.model.get("fileType") && chorus.urlHelpers.fileIconUrl(this.model.get("fileType"))
            };
        }
    });
})(jQuery, chorus);
