puts require File.expand_path(File.join(File.dirname(__FILE__), 'spec_helper')) ; puts __FILE__

describe "CSV Uploads", :greenplum_integration do
  let(:workspace) { workspaces(:real) }

  before do
    run_jobs_synchronously
    GreenplumIntegration.exec_sql_line("DROP TABLE IF EXISTS test_schema.test;")
  end

  it "uploads a csv file into a new table" do
    login(users(:admin))
    visit("#/workspaces/#{workspace.id}/datasets")
    click_button "Import File"
    csv_file = File.join(File.dirname(__FILE__), '../fixtures/test.csv')
    within_modal do
      attach_file("csv[contents]", csv_file)
      click_button "Upload File"
      click_button "Import Data"
    end
    find("a.name:contains('test')").click
    page_title_should_be("test")
    within ".dataset_sidebar" do
      page.should have_no_selector(".loading_section")
      page.should have_no_text("loading...")
      first("li", :text => "Information").click()
      csv_length = File.read(csv_file).split("\n").length - 1
      page.should have_content("Rows #{csv_length}")
    end
    current_route.should =~ /datasets\/(\d)+/
  end
end
