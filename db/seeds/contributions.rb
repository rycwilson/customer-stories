
module ContributionsSeed

  def self.create success_id, role, submitted_at, status, user=nil, created=nil
    text = FFaker::Lorem.paragraph
    (status == 'feedback') ? feedback = text : feedback = nil
    (status == 'contribution') ? contribution = text : contribution = nil
    contributor = user || ContributionsSeed::create_contributor
    c = Contribution.new(
      success_id:           success_id,
      contributor_id:       contributor.id,
      role:                 role,
      status:               status,
      feedback:             feedback,
      contribution:         contribution,
      notes:                FFaker::Lorem.paragraph,
      submitted_at:         submitted_at,
      access_token:         SecureRandom.hex,
      created_at:           created || Time.now,
    )  
    # c.remind_at = Time.now + rand(5).minutes if (status == 'request')
    # c.remind_at = Time.now + rand(5).minutes if (status == 'remind1')
    c.request_remind_at = Time.now + c.first_reminder_wait.days if (status == 'request')
    c.request_remind_at = Time.now + c.second_reminder_wait.days if (status == 'remind1')
    puts("create contribution error: " + c.errors.full_messages.join(', ')) unless c.save
    c
  end


  def self.create_contributor first_name=nil, last_name=nil, cont_email=nil
    email = FFaker::Internet.email # need to use the same value twice, so store in variable
    contributor = User.new(
      first_name:   first_name || FFaker::Name.first_name,
      last_name:    last_name || FFaker::Name.last_name,
      email:        cont_email || email,
      # password is necessary, so just set it to the email
      password:     'password',
      sign_up_code: 'csp_beta'
    )
    puts("create contributor error: " + contributor.errors.full_messages.join(', ')) unless contributor.save
    contributor
  end

end

