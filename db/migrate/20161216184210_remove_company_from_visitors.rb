class RemoveCompanyFromVisitors < ActiveRecord::Migration
  def change
    remove_reference :visitors, :company, index: true, foreign_key: true
  end
end
