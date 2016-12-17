class AddCompanyToVisitorActions < ActiveRecord::Migration
  def change
    add_reference :visitor_actions, :company, index: true, foreign_key: true
  end
end
