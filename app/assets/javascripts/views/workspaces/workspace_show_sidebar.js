chorus.views.WorkspaceShowSidebar = chorus.views.Sidebar.extend({
    constructorName: "WorkspaceShowSidebarView",
    templateName:"workspace_show_sidebar",

    subviews: {
        ".workspace_member_list": "workspaceMemberList"
    },

    setup:function () {
        this.bindings.add(this.model, "image:change", this.render);
        this.bindings.add(this.model.members(), "reset", this.render);
        this.workspaceMemberList = new chorus.views.WorkspaceMemberList();
        this.workspaceMemberList.setWorkspace(this.model);
    },

    additionalContext:function () {
        return {
            workspaceAdmin:this.model.workspaceAdmin(),
            imageUrl:this.model.fetchImageUrl(),
            hasImage:this.model.hasImage(),
            hasSandbox:!!this.model.sandbox(),
            canUpdate: this.model.canUpdate(),
            active: this.model.isActive(),
            canKaggle: chorus.models.Config.instance().get("kaggleConfigured") && this.model.canUpdate() && this.model.isActive(),
            kaggleUrl: this.model.showUrl()+"/kaggle"
        };
    },

    postRender:function () {
        var self = this;
        this.$(".workspace_image").load(function () {
            self.$(".after_image").removeClass("hidden");
        });
        this.$('.workspace_image').load(_.bind(this.recalculateScrolling, this));
        this._super('postRender');
    }
});
