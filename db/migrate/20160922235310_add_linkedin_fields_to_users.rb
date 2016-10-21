class AddLinkedinFieldsToUsers < ActiveRecord::Migration

  def change
    add_column :users, :linkedin_title, :string
    add_column :users, :linkedin_company, :string
    add_column :users, :linkedin_location, :string
    add_column :users, :linkedin_photo_url, :string

    remove_column :users, :uid, :string
    remove_column :users, :provider, :string
    remove_column :users, :token, :string
  end

end
