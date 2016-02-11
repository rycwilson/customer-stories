
module ContributionsSeed

  def self.create success_id, role, status, user=nil
    text = FFaker::Lorem.paragraph
    (status == 'feedback') ? feedback = text : feedback = nil
    (status == 'contribution') ? contribution = text : contribution = nil
    contributor = user || ContributionsSeed::create_contributor
    c = Contribution.new(
       success_id: success_id,
          user_id: contributor.id,
         linkedin: user ? true : false,
             role: role,
           status: status,
         feedback: feedback,
     contribution: contribution)
    # c.remind_at = Time.now + rand(5).minutes if (status == 'request')
    # c.remind_at = Time.now + rand(5).minutes if (status == 'remind1')
    c.remind_at = Time.now + c.remind_1_wait.days if (status == 'request')
    c.remind_at = Time.now + c.remind_2_wait.days if (status == 'remind1')
    puts("create contribution error: " + c.errors.full_messages.join(', ')) unless c.save
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
    puts("create contributor error: " + contributor.errors.full_messages.join(', ')) unless contributor.save
    contributor
  end

end

