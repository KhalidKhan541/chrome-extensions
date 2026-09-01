chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.clearAll();
  console.log('Social Scheduler installed');
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('post_')) {
    const postId = alarm.name.replace('post_', '');
    await handleScheduledPost(postId);
  } else if (alarm.name.startsWith('reminder_')) {
    const postId = alarm.name.replace('reminder_', '');
    await handleReminder(postId);
  }
});

async function handleScheduledPost(postId) {
  try {
    const data = await chrome.storage.local.get('social_scheduler_queue');
    const queue = data.social_scheduler_queue || [];
    const postIndex = queue.findIndex(p => p.id === postId);
    
    if (postIndex === -1) return;
    
    const post = queue[postIndex];
    
    if (post.status !== 'scheduled') return;
    
    post.status = 'posting';
    await chrome.storage.local.set({ social_scheduler_queue: queue });
    
    chrome.notifications.create(`post_${postId}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Social Scheduler',
      message: `Posting to ${post.platforms.join(', ')}...`,
      priority: 2
    });
    
    const success = await simulatePost(post);
    
    if (success) {
      post.status = 'posted';
      post.postedAt = new Date().toISOString();
      
      chrome.notifications.create(`posted_${postId}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Post Published!',
        message: `Your post has been published to ${post.platforms.join(', ')}`,
        priority: 1
      });
      
      if (post.recurring) {
        await scheduleNextRecurring(post);
      }
    } else {
      post.status = 'failed';
      post.error = 'Failed to publish post';
      post.failedAt = new Date().toISOString();
      
      chrome.notifications.create(`failed_${postId}`, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Post Failed',
        message: `Failed to publish your post to ${post.platforms.join(', ')}`,
        priority: 2
      });
    }
    
    await chrome.storage.local.set({ social_scheduler_queue: queue });
    
  } catch (error) {
    console.error('Error handling scheduled post:', error);
  }
}

async function handleReminder(postId) {
  try {
    const data = await chrome.storage.local.get('social_scheduler_queue');
    const queue = data.social_scheduler_queue || [];
    const post = queue.find(p => p.id === postId);
    
    if (!post || post.status !== 'scheduled') return;
    
    const scheduledTime = new Date(post.scheduledAt);
    const now = new Date();
    const minutesUntil = Math.floor((scheduledTime.getTime() - now.getTime()) / 60000);
    
    chrome.notifications.create(`reminder_${postId}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Post Reminder',
      message: `Your post is scheduled in ${minutesUntil} minute(s). Platforms: ${post.platforms.join(', ')}`,
      priority: 1,
      requireInteraction: true
    });
    
  } catch (error) {
    console.error('Error handling reminder:', error);
  }
}

async function simulatePost(post) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1000);
  });
}

async function scheduleNextRecurring(post) {
  const nextDate = Scheduler.calculateNextOccurrence(
    post.recurring.interval,
    new Date(post.scheduledAt)
  );
  
  const newPost = { ...post };
  delete newPost.id;
  delete newPost.status;
  delete newPost.postedAt;
  delete newPost.createdAt;
  newPost.scheduledAt = nextDate.toISOString();
  newPost.status = 'scheduled';
  newPost.id = Scheduler.generateId();
  
  const data = await chrome.storage.local.get('social_scheduler_queue');
  const queue = data.social_scheduler_queue || [];
  queue.push(newPost);
  queue.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  await chrome.storage.local.set({ social_scheduler_queue: queue });
  
  Scheduler.setAlarm(nextDate, newPost.id);
  Scheduler.scheduleReminder(nextDate, newPost.id);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPostQueue') {
    chrome.storage.local.get('social_scheduler_queue', (data) => {
      sendResponse(data.social_scheduler_queue || []);
    });
    return true;
  }
  
  if (request.action === 'getStats') {
    QueueManager.getStats().then(stats => {
      sendResponse(stats);
    });
    return true;
  }
  
  if (request.action === 'processPost') {
    handleScheduledPost(request.postId).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
