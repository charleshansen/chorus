describe("chorus.views.userEdit", function() {
    beforeEach(function() {
        this.user = rspecFixtures.user({admin: true});
        setLoggedInUser({'username': this.user.get("username")});
        this.view = new chorus.views.UserEdit({model: this.user});
    });

    describe("#setup", function() {
        it("instantiates an ImageUpload view with the model", function() {
            var imageUpload = this.view.imageUpload;
            expect(imageUpload instanceof chorus.views.ImageUpload).toBeTruthy();
            expect(imageUpload.model).toBe(this.view.model);
        });

        it("triggers 'invalidated' on the user after 'image:change' is triggered", function() {
            spyOnEvent(this.user, "invalidated");
            this.user.trigger("image:change");
            expect("invalidated").toHaveBeenTriggeredOn(this.user);
        });
    });

    describe("#render", function() {
        beforeEach(function() {
            this.view.render();
        });

        context("when editing yourself", function() {
            context("as an admin", function() {
                beforeEach(function() {
                    spyOn($.fn, "limitMaxlength");
                    setLoggedInUser({'admin': true});
                    this.view.render();
                });

                it("initializes the form from the model", function() {
                    expect(this.view.$("input[name=firstName]").val()).toBe(this.user.get("firstName"));
                    expect(this.view.$("input[name=lastName]").val()).toBe(this.user.get("lastName"));
                    expect(this.view.$("span[name=username]").text()).toBe(this.user.get("username"));
                    expect(this.view.$("input[name=email]").val()).toBe(this.user.get("email"));
                    expect(this.view.$("input[name=title]").val()).toBe(this.user.get('title'));
                    expect(this.view.$("textarea[name=notes]").text()).toBe(this.user.get('notes'));
                    expect(this.view.$("input[name=dept]").val()).toBe(this.user.get('dept'));
                    expect(this.view.$("input[name=admin]").prop("checked")).toBe(this.user.get("admin"));
                });

                it("limits the length of the notes field", function() {
                    expect($.fn.limitMaxlength).toHaveBeenCalledOnSelector("textarea");
                });

                context("submitting the form", function() {
                    beforeEach(function() {
                        this.view.$("input[name=firstName]").val("Frankie");
                        this.view.$("input[name=email]").val("frankie_knuckles@nyclol.com");
                        this.view.$("input[name=dept]").val("awesomeness dept");
                        this.view.$("textarea[name=notes]").text("Here are some notes\n more than one line");
                        this.view.$("form").submit();
                    });

                    context("saving the user with valid data", function() {
                        beforeEach(function() {
                            spyOn(this.user, "save").andCallThrough();
                        });

                        it("modify the user with the form attributes", function() {
                            expect(this.user.attributes["firstName"]).toBe("Frankie");
                            expect(this.user.attributes["lastName"]).toBe(this.user.get("lastName"));
                            expect(this.user.attributes["username"]).toBe(this.user.get("username"));
                            expect(this.user.attributes["email"]).toBe("frankie_knuckles@nyclol.com");
                            expect(this.user.attributes["dept"]).toBe("awesomeness dept");
                            expect(this.user.attributes["admin"]).toBe(this.user.get("admin"));
                            expect(this.user.attributes["notes"]).toBe("Here are some notes\n more than one line");
                        });

                        context("when the user form has admin unchecked", function() {
                            beforeEach(function() {
                                this.view.$("input[name=admin]").prop("checked", false);
                            });

                            it("sets the user attribute 'admin' to false", function() {
                                this.view.$("form").submit();
                                expect(this.user.attributes["admin"]).toBe(false);
                            });
                        });

                        it("saves the user", function() {
                            this.view.$("form").submit();
                            expect(this.user.save).toHaveBeenCalled();
                        });

                        context("when user creation is successful", function() {
                            it("redirects to user index", function() {
                                spyOn(chorus.router, "navigate");
                                this.view.model.trigger("saved");
                                expect(chorus.router.navigate).toHaveBeenCalledWith(this.view.model.showUrl());
                            });
                        });
                    });

                    context("when user creation fails on the server", function() {
                        beforeEach(function() {
                            this.view.model.serverErrors = {fields: {a: {BLANK: {}}}};
                            this.view.model.trigger("saveFailed");
                        });

                        it("doesn't redirect", function() {
                            expect(this.view.$("form")).toExist();
                        });

                        it("retains the data already entered", function() {
                            expect(this.view.$("input[name=firstName]").val()).toBe("Frankie");
                        });
                    });

                    context("saving the user with invalid data", function() {
                        beforeEach(function() {
                            spyOn(Backbone.Model.prototype, 'save');
                            this.view.$("input[name=email]").val("bademail");
                            this.view.$("form").submit();
                        });
                        it("does not save the user", function() {
                            expect(Backbone.Model.prototype.save).not.toHaveBeenCalled();
                        });

                        it("retains the data already entered", function() {
                            expect(this.view.$("input[name=firstName]").val()).toBe("Frankie");
                        });

                        it("does not change the local model", function() {
                            expect(this.view.model.get("email")).not.toBe("bademail");
                        });
                    });

                    context("the form has extra whitespace around an input", function() {
                        beforeEach(function() {
                            this.view.$("input[name=firstName]").val("     spaces     ");
                            this.view.$("form").submit();
                        });

                        it("trims the whitespace before submission", function() {
                            expect(this.user.attributes["firstName"]).toBe("spaces");
                        });
                    });

                });

                context("cancelling", function() {
                    beforeEach(function() {
                        spyOn(this.view.$("form")[0], "submit");
                        this.view.$("button.cancel").click();
                    });

                    it("does not submit the form", function() {
                        expect(this.view.$("form")[0].submit).not.toHaveBeenCalled();
                    });

                    it("navigates back", function() {
                        expect(window.history.back).toHaveBeenCalled();
                    });
                });
            });

            context("as a non admin", function() {
                beforeEach(function() {
                    setLoggedInUser({'admin': false});
                    this.view.render();
                });

                it("does not display the admin checkbox", function() {
                    expect(this.view.$("input[name=admin]")).not.toExist();
                });
            });

            it("has an .image_upload element", function() {
                expect(this.view.$(".image_upload")).toExist();
            });

            it("shows the correct action text on image upload", function() {
                expect(this.view.$(".image_upload a.action").text()).toMatchTranslation("users.edit_photo");
            });
        });

        context("editing a user that is not yourself", function() {
            beforeEach(function() {
                this.user = rspecFixtures.user();
                this.view = new chorus.views.UserEdit({model: this.user});

                setLoggedInUser({'username': 'a_different_user', 'admin': false});
                this.view.render();
            });
            it("renders the admin-only warning", function() {
                expect(this.view.$(".aint_admin")).toExist();
            });

            context("as an admin", function() {
                beforeEach(function() {
                    setLoggedInUser({'username': 'a_different_user', 'admin': true});
                    this.view.render();
                });
                it("gives you permission to edit the user", function() {
                    expect(this.view.$(".aint_admin")).not.toExist();
                    expect(this.view.$("input[name=firstName]").val()).toBe(this.user.get("firstName"));
                    expect(this.view.$("input[name=lastName]").val()).toBe(this.user.get("lastName"));
                    expect(this.view.$("span[name=username]").text()).toBe(this.user.get("username"));
                });
            });
        });
    });
});

