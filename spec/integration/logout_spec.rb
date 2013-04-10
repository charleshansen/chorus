puts require File.expand_path(File.join(File.dirname(__FILE__), 'spec_helper')) ; puts __FILE__

describe "Logout" do
  it "logs the user out" do
    login(users(:admin))
    wait_for_page_load
    find(".header .username a").click
    find(".menu.popup_username").should have_no_selector(".hidden")
    within '.menu.popup_username' do
      find("a", :text => "Sign Out", :visible => true).click
    end
    page.should have_content("Login")
    current_route.should == "login"
  end
end
