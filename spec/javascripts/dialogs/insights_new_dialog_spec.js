describe("chorus.dialogs.InsightsNewDialog", function() {
    beforeEach(function() {
        stubDelay();
        this.dialog = new chorus.dialogs.InsightsNew({ allowWorkspaceAttachments: true, workspaceId: 22 });

        $('#jasmine_content').append(this.dialog.el);
        this.dialog.render();
    });

    describe("#setup", function() {
        it("creates an Insight as the model", function() {
            expect(this.dialog.model).toBeA(chorus.models.Insight);
        });

        it("uses the correct workspace id", function() {
            expect(this.dialog.model.get("workspaceId")).toBe(22);
        });
    });

    describe("#render", function() {
        it("has the right title", function() {
            expect(this.dialog.$(".dialog_header h1")).toContainTranslation("insight.new_dialog.title");
        });

        it("has the right placeholder", function() {
            expect(this.dialog.$("textarea[name=body]").attr("placeholder")).toMatchTranslation("insight.placeholder");
        });

        it("has the right button text", function() {
            expect(this.dialog.$("button.submit").text().trim()).toMatchTranslation("insight.button.create");
        });

        describe("clicking the submit button", function() {
            beforeEach(function() {
                spyOn(this.dialog.model, 'save').andCallThrough();
                this.dialog.$("textarea").val("a fine selection of text, especially considering the price point");
                this.dialog.$("button.submit").click();
            });

            it("saves the insight model with the text", function() {
                expect(this.dialog.model.save).toHaveBeenCalled();
                expect(this.dialog.model.get("body")).toBe("a fine selection of text, especially considering the price point");
                expect(this.server.lastCreate().url).toBe('/notes/');
            });
        });
    });
});
