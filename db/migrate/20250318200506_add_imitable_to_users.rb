class AddImitableToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :imitable, :boolean, default: false    
    ['Dan acme-test', 'Dan Lindblom', 'Dan Demo', 'Ryan Wilson', 'Ryan Palo', 'Bill Lee', 'Carlos Ramon', 'Kevin Turner', 'Heather Annesley', 'Haley Fraser', 'Rachelle Benson']
      .each do |name| 
        User.where.not(company_id: nil).where(first_name: name.split(' ').first, last_name: name.split(' ').last).update_all(imitable: true) 
      end
  end
end
