require 'spec_helper'

describe WorkspacesController do
  ignore_authorization!

  let(:owner) { users(:no_collaborators) }
  let(:other_user) { users(:the_collaborator) }
  before do
    log_in owner
  end

  describe "#index" do
    let(:private_workspace) { workspaces(:private_with_no_collaborators) }

    it "returns workspaces that are public" do
      get :index
      response.code.should == "200"
      decoded_response.map(&:name).should include workspaces(:public).name
    end

    it "returns workspaces the user is a member of" do
      log_in other_user
      get :index
      response.code.should == "200"
      decoded_response.map(&:name).should include private_workspace.name
    end

    it "does not return private workspaces user is not a member of" do
      other_private = workspaces(:private)
      get :index
      decoded_response.collect(&:name).should_not include other_private.name
    end

    it "includes private workspaces owned by the authenticated user" do
      get :index
      decoded_response.collect(&:name).should include private_workspace.name
    end

    it "sorts by workspace name" do
      get :index
      decoded_response[0].name.downcase.should < decoded_response[1].name.downcase
    end

    it "scopes by active status" do
      get :index, :active => 1
      decoded_response.size.should == Workspace.workspaces_for(owner).active.count
    end

    it "scopes by memberships" do
      get :index, :user_id => other_user.id
      inaccessible_workspaces = other_user.workspaces - Workspace.accessible_to(owner)
      decoded_response.size.should == other_user.workspaces.count - inaccessible_workspaces.length
      decoded_response.map(&:name).should_not include(workspaces(:private).name)
    end

    it "shows admins all workspaces scoped by membership" do
      log_in users(:admin)
      get :index, :user_id => other_user.id
      decoded_response.size.should == other_user.workspaces.count
    end

    describe "pagination" do

      it "paginates the collection" do
        get :index, :page => 1, :per_page => 2
        decoded_response.length.should == 2
      end

      it "accepts a page parameter" do
        get :index, :page => 2, :per_page => 2
        decoded_response.first.name.should == Workspace.workspaces_for(owner).order("lower(name) ASC")[2].name
      end

      it "defaults the per_page to fifty" do
        get :index
        request.params[:per_page].should == 50
      end
    end

    generate_fixture "workspaceSet.json" do
      get :index, :show_latest_comments => 'true'
    end

    it_behaves_like :succinct_list
  end

  describe "#create" do
    context "with valid parameters" do
      let(:params) { {:name => "foobar"} }
      it "creates a workspace" do
        expect {
          post :create, params
        }.to change(Workspace, :count).by(1)
      end

      it "creates an event for public workspace" do
        expect_to_add_event(Events::PublicWorkspaceCreated, owner) do
          post :create, params.merge(:public => true)
        end
      end

      it "creates an event for private workspace" do
        expect_to_add_event(Events::PrivateWorkspaceCreated, owner) do
          post :create, params.merge(:public => false)
        end
      end

      it "presents the workspace" do
        mock_present do |workspace|
          workspace.should be_a(Workspace)
          workspace.name.should == "foobar"
        end
        post :create, params
      end

      it "adds the owner as a member of the workspace" do
        post :create, params
        Workspace.last.memberships.first.user.should == owner
      end

      it "sets the authenticated user as the owner of the new workspace" do
        post :create, params
        Workspace.last.owner.should == owner
      end
    end
  end

  describe "#show" do
    let(:owner) { users(:owner) }
    let(:workspace) { workspaces(:public) }

    context "with a valid workspace id" do
      it "uses authentication" do
        mock(subject).authorize!(:show, workspace)
        get :show, :id => workspace.to_param
      end

      it "succeeds" do
        get :show, :id => workspace.to_param
        response.should be_success
      end

      it "presents the workspace" do
        mock.proxy(controller).present(workspace, :presenter_options => {:show_latest_comments => false})
        get :show, :id => workspace.to_param
      end
    end

    context "with an invalid workspace id" do
      it "returns not found" do
        get :show, :id => 'bogus'
        response.should be_not_found
      end
    end

    generate_fixture "workspace.json" do
      get :show, :id => workspace.to_param, :show_latest_comments => 'true'
    end

    generate_fixture "managedWorkspace.json" do
      get :show, :id => workspaces(:managed).to_param
    end
  end

  #Add contexts for the different params and workspaces
  describe "#update" do
    let(:public_workspace) { workspaces(:public_with_no_collaborators) }
    let(:private_workspace) { workspaces(:private_with_no_collaborators) }
    let(:workspace) {private_workspace}

    let(:params) { {
        :id => workspace.id,
        :owner => {id: "3"},
        :public => workspace.public?.to_s,
        :archived => workspace.archived?.to_s
    } }

    before do
      stub(Sunspot).index.with_any_args
    end

    context "when the current user has update authorization" do
      it "uses authentication" do
        mock(subject).authorize!(:update, workspace)
        put :update, params
      end

      it "can change the owner" do
        member = users(:the_collaborator)
        put :update, params.merge(:owner_id => member.id.to_s)

        workspace.reload
        workspace.owner.should == member
        response.should be_success
      end

      context "changing a public workspace" do
        let(:workspace) {public_workspace}

        it "allows updating the workspace's privacy" do
          put :update, params.merge(:public => false)
          workspace.reload
          workspace.should_not be_public
          response.should be_success
        end

        it "generates an event" do
          expect_to_add_event(Events::WorkspaceMakePrivate, owner) do
            put :update, params.merge(:public => false)
          end
        end
      end

      context "changing a private workspace" do
        let(:workspace) {private_workspace}

        it "allows updating the workspace's privacy" do
          put :update, params.merge(:public => "true")

          workspace.reload
          workspace.should be_public
          response.should be_success
        end

        it "generates an event" do
          expect_to_add_event(Events::WorkspaceMakePublic, owner) do
            put :update, params.merge(:public => "true")
          end
        end
      end

      describe "unarchiving workspace" do
        let(:workspace) {workspaces(:archived)}

        it "unarchives the workspace" do
          put :update, params.merge(:archived => "false")
          workspace.reload
          workspace.archived_at.should be_nil
          workspace.archiver.should be_nil
          response.should be_success
        end

        it "generates an event" do
          expect_to_add_event(Events::WorkspaceUnarchived, owner) do
            put :update, params.merge(:archived => "false")
          end
        end
      end

      describe "archiving the workspace" do
        let(:workspace) { workspaces(:public) }

        before do
          [Import, ImportSchedule].each do |stuff|
            any_instance_of(stuff) do |import|
              stub(import).tables_have_consistent_schema { true }
              stub(import).table_exists? { true }
            end
          end
        end

        it "archives the workspace" do
          put :update, params.merge(:archived => "true")
          workspace.reload

          workspace.archived_at.should be_within(1.minute).of(Time.current)
          workspace.archiver.should == owner
        end

        it "generates an event" do
          expect_to_add_event(Events::WorkspaceArchived, owner) do
            put :update, params.merge(:archived => "true")
          end
        end
      end
    end
  end

  describe "#destroy" do
    let(:workspace) { workspaces(:public) }
    let(:params) { {:id => workspace.id} }

    before do
      [Import, ImportSchedule].each do |stuff|
        any_instance_of(stuff) do |import|
          stub(import).tables_have_consistent_schema { true }
          stub(import).table_exists? { true }
        end
      end
    end

    it "uses authorization" do
      mock(subject).authorize!(:destroy, workspace)
      delete :destroy, :id => workspace.to_param
    end

    it "destroys the workspace" do
      expect {
        delete :destroy, params
      }.to change(Workspace, :count).by(-1)
    end

    it "destroys the workspace" do
      delete :destroy, params
      response.code.should == "200"
    end

    it "creates an event" do
      expect_to_add_event(Events::WorkspaceDeleted, owner) do
        post :destroy, params
      end
    end
  end

  def expect_to_add_event(event_class, owner)
    expect {
      yield
    }.to change(event_class.by(owner), :count).by(1)
  end
end
