require 'spec_helper'

describe InstanceCredential do
  it "should allow mass-assignment of username and password" do
    InstanceCredential.new(:username => 'aname').username.should == 'aname'
    InstanceCredential.new(:password => 'apass').password.should == 'apass'
  end


  describe "associations" do
    it { should belong_to :owner }
    it { should belong_to :instance }
  end
end