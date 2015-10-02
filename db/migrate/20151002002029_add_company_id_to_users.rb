class AddCompanyIdToUsers < ActiveRecord::Migration

  def change
    change_table :users do |t|
      t.references :company, index: true, foreign_key: true
    end
  end

end
