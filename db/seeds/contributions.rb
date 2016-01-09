
module ContributionsSeed

  def self.create success_id, role, status
    text = FFaker::Lorem.paragraph
    (status == 'feedback') ? feedback = text : feedback = nil
    (status == 'contribution') ? contribution = text : contribution = nil
    contributor = ContributionsSeed::create_contributor
    c = Contribution.new(
       success_id: success_id,
          user_id: contributor.id,
             role: role,
           status: status,
         feedback: feedback,
     contribution: contribution)
    c.remind_at = Time.now + c.remind_1_wait.days if (status == 'request')
    c.remind_at = Time.now + c.remind_2_wait.days if (status == 'remind1')
    puts c.errors.full_messages unless c.save
    c
  end


  def self.create_contributor first_name=nil, last_name=nil, cont_email=nil, linkedin_url=nil
    email = FFaker::Internet.email # need to use the same value twice, so store in variable
    contributor = User.new(
        first_name: first_name || FFaker::Name.first_name,
         last_name: last_name || FFaker::Name.last_name,
             email: cont_email || email,
      # password is necessary, so just set it to the email
          password: email,
      linkedin_url: linkedin_url,
      sign_up_code: 'csp_beta')
    puts contributor.errors.full_messages unless contributor.save
    contributor
  end

end

